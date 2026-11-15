"""Convierte el texto de pantalla en texto "para el oído" antes de mandarlo al TTS.

El guion se escribe tal y como se lee en pantalla (GTA 6, PS5, 79,99 euros...).
Aquí lo traducimos a cómo debe sonar en español. Los subtítulos siguen usando
el texto original.
"""
import re

from num2words import num2words

# El orden importa: primero las expresiones largas.
PRONUNCIACION = [
    ("GTA Online", "Ge Te A Onláin"),
    ("GTA+", "Ge Te A Plus"),
    ("GTA VI", "Ge Te A Seis"),
    ("GTA 6", "Ge Te A Seis"),
    ("GTA V", "Ge Te A Cinco"),
    ("GTA IV", "Ge Te A Cuatro"),
    ("GTA San Andreas", "Ge Te A San Andreas"),
    ("GTA", "Ge Te A"),
    ("Red Dead Redemption 2", "Red Ded Ridémpshon Dos"),
    ("Red Dead Redemption", "Red Ded Ridémpshon"),
    ("PS5 Pro", "Pe Ese Cinco Pro"),
    ("PS5 Slim", "Pe Ese Cinco Eslim"),
    ("PS5", "Pe Ese Cinco"),
    ("PS4", "Pe Ese Cuatro"),
    ("PS3", "Pe Ese Tres"),
    ("PlayStation Network", "Pléisteishon Nétguork"),
    ("PlayStation Store", "Pléisteishon Stor"),
    ("PlayStation", "Pléisteishon"),
    ("Microsoft Store", "Máicrosoft Stor"),
    ("Xbox Series X|S", "Equis Box Series Equis y Ese"),
    ("Series X|S", "Series Equis y Ese"),
    ("Series X", "Series Equis"),
    ("Series S", "Series Ese"),
    ("Xbox 360", "Equis Box trescientos sesenta"),
    ("Xbox Live", "Equis Box Láiv"),
    ("Xbox", "Equis Box"),
    ("Rockstar Games", "Rócstar Guéims"),
    ("Rockstar", "Rócstar"),
    ("Take-Two", "Téik Tu"),
    ("Vintage Vice City", "Víntach Váis Síti"),
    ("Vice City", "Váis Síti"),
    ("Vice Beach", "Váis Bich"),
    ("Leonida Keys", "Leonida Kíis"),
    ("Florida Keys", "Florida Kíis"),
    ("Keys", "Kíis"),
    ("Grassrivers", "Grasríverss"),
    ("Port Gellhorn", "Port Guéljorn"),
    ("Mount Kalaga", "Máunt Kalága"),
    ("Jason Duval", "Yéison Duvál"),
    ("Jason", "Yéison"),
    ("Lucia", "Lucía"),
    ("Schreier", "Shráier"),
    ("Microsoft", "Máicrosoft"),
    ("Cal Hampton", "Cal Jámpton"),
    ("Boobie Ike", "Búbi Áik"),
    ("Boobie", "Búbi"),
    ("Dre'Quan Priest", "Drecuán Príst"),
    ("Dre'Quan", "Drecuán"),
    ("Real Dimez", "Ríal Dáims"),
    ("Bae-Luxe", "Béi Lux"),
    ("Roxy", "Róxi"),
    ("Raul Bautista", "Raúl Bautista"),
    ("Brian Heder", "Bráian Jéder"),
    ("Brian", "Bráian"),
    ("Only Raw Records", "Ónli Ró Récords"),
    ("Only Raw", "Ónli Ró"),
    ("Jack of Hearts", "Yac of Járts"),
    ("Stock 305", "Stoc tres cero cinco"),
    ("One-Eyed Willie's", "Uán Áid Uílis"),
    ("Ultimate Edition", "Últimeit Edíshon"),
    ("Ultimate", "Últimeit"),
    ("Everglades", "Évergleids"),
    ("Black Friday", "Blac Fráidei"),
    ("Cloud Gaming", "Cláud Guéiming"),
    ("ray tracing", "réi tréising"),
    ("Newswire", "Niúsguaier"),
    ("YouTube", "Yutub"),
    ("TikTok", "Tictoc"),
    ("Steam", "Estim"),
    ("Epic Games", "Épic Guéims"),
    ("Bloomberg", "Blúmberg"),
    ("Wi-Fi", "Uaifái"),
    ("online", "onláin"),
    ("Online", "Onláin"),
    ("offline", "oflaín"),
    ("streaming", "estríming"),
    ("streamers", "estrímers"),
    ("spoilers", "espóilers"),
    ("spoiler", "espóiler"),
    ("tráiler", "tréiler"),
    ("tráileres", "tréilers"),
    ("gameplay", "guéimplei"),
    ("hype", "jáip"),
    ("Slim", "Eslim"),
    ("PSSR", "Pe Ese Ese Erre"),
    ("HDR", "Hache De Erre"),
    ("PCIe 4.0", "Pe Ce I E cuatro punto cero"),
    ("MB/s", "megas por segundo"),
    ("NVMe", "En Uve Eme E"),
    ("M.2", "Eme Dos"),
    ("SSD", "Ese Ese De"),
    ("USB", "U Ese Be"),
    ("DLC", "De Ele Ce"),
    ("APK", "A Pe Ka"),
    ("PC", "Pe Ce"),
    ("FPS", "efe pe ese"),
    ("fps", "efe pe ese"),
    ("4K", "cuatro ka"),
    ("CFexpress", "Ce Efe Exprés"),
]

UNIDADES = {
    "€": "euros", "euros": "euros", "$": "dólares", "dólares": "dólares",
    "£": "libras", "libras": "libras", "pesos": "pesos",
}


def _n(texto: str) -> str:
    return num2words(int(texto), lang="es")


def _hora(m: re.Match) -> str:
    prefijo = "a " if m[0].startswith("a ") else ""
    h, mins = int(m[1]), int(m[2])
    h12 = h % 12 or 12
    if h == 0 or h >= 21:
        franja = "de la noche"
    elif h < 6:
        franja = "de la madrugada"
    elif h < 12:
        franja = "de la mañana"
    elif h == 12:
        franja = "del mediodía"
    else:
        franja = "de la tarde"
    articulo = "la" if h12 == 1 else "las"
    nombre = "una" if h12 == 1 else _n(str(h12))
    extra = f" y {_n(str(mins))}" if mins else ""
    return f"{prefijo}{articulo} {nombre}{extra} {franja}"


def _numeros(t: str) -> str:
    # 1.499 -> 1499 (separador de miles)
    t = re.sub(r"(?<=\d)\.(?=\d{3}\b)", "", t)
    # 79,99 euros / 79,99 € / $79.99
    t = re.sub(r"\$(\d+)[.,](\d{2})", lambda m: f"{_n(m[1])} con {_n(m[2])} dólares", t)
    t = re.sub(
        r"(\d+),(\d{2})\s?(€|euros|dólares|libras|\$|pesos)",
        lambda m: f"{_n(m[1])} con {_n(m[2])} {UNIDADES[m[3]]}", t,
    )
    t = re.sub(r"(\d+)\s?€", lambda m: f"{_n(m[1])} euros", t)
    t = re.sub(r"£(\d+)", lambda m: f"{_n(m[1])} libras", t)
    # Decimales con coma: 1,9 TB
    t = re.sub(r"(\d+),(\d)\b", lambda m: f"{_n(m[1])} coma {_n(m[2])}", t)
    # Horas 00:00 / 23:00 -> "las once de la noche"
    t = re.sub(r"\b(?:(?:a )?las? )?(\d{1,2}):(\d{2})\b", _hora, t)
    # Unidades de almacenamiento y porcentajes
    t = re.sub(r"(\d+)\s?GB\b", lambda m: f"{_n(m[1])} gigas", t)
    t = re.sub(r"(\d+)\s?TB\b", lambda m: f"{_n(m[1])} teras", t)
    t = re.sub(r"\bGB\b", "gigas", t)
    t = re.sub(r"\bTB\b", "teras", t)
    t = re.sub(r"(\d+)\s?%", lambda m: f"{_n(m[1])} por ciento", t)
    # Resto de enteros
    t = re.sub(r"\d+", lambda m: _n(m[0]), t)
    return t


def para_el_oido(texto: str) -> str:
    t = texto
    for original, sonido in PRONUNCIACION:
        patron = r"(?<![\wÁÉÍÓÚáéíóúñÑ])" + re.escape(original) + r"(?![\wÁÉÍÓÚáéíóúñÑ])"
        t = re.sub(patron, sonido, t)
    t = _numeros(t)
    t = t.replace("·", ",").replace("|", " y ").replace("—", ", ").replace("–", ", ")
    t = re.sub(r"\s+", " ", t).strip()
    return t


if __name__ == "__main__":
    pruebas = [
        "GTA 6 cuesta 79,99 euros en PS5 y Xbox Series X|S.",
        "Ocupa hasta 212 GB y va a 30 fps; en México cuesta 1.499 pesos.",
        "En Canarias se desbloquea a las 23:00 y en la península a las 00:00.",
        "La Ultimate cuesta $99.99 y la PS5 Pro tiene PSSR.",
    ]
    for p in pruebas:
        print(p, "\n  ->", para_el_oido(p))
