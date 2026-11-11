export const CHALLENGE_CATEGORIES = [
  "cultura-general",
  "ciencias",
  "tecnologia",
  "historia",
  "geografia",
  "deportes",
] as const;

export const CHALLENGE_DIFFICULTIES = ["facil", "intermedia", "dificil"] as const;

export type ChallengeCategoryCode = (typeof CHALLENGE_CATEGORIES)[number];
export type ChallengeDifficultyCode = (typeof CHALLENGE_DIFFICULTIES)[number];

export type ChallengeSeed = {
  statement: string;
  correctAnswer: boolean;
  category: ChallengeCategoryCode;
  difficulty: ChallengeDifficultyCode;
  suggestedTimeLimitSeconds: number;
};

const TIME_BY_DIFFICULTY: Record<ChallengeDifficultyCode, number> = {
  facil: 20,
  intermedia: 25,
  dificil: 30,
};

function challenge(
  category: ChallengeCategoryCode,
  difficulty: ChallengeDifficultyCode,
  correctAnswer: boolean,
  statement: string,
): ChallengeSeed {
  return {
    statement,
    correctAnswer,
    category,
    difficulty,
    suggestedTimeLimitSeconds: TIME_BY_DIFFICULTY[difficulty],
  };
}

export const CHALLENGE_BANK: readonly ChallengeSeed[] = [
  challenge("cultura-general", "facil", false, "La Tierra tiene dos lunas naturales permanentes."),
  challenge("cultura-general", "facil", false, "Una hora tiene cien minutos."),
  challenge("cultura-general", "facil", true, "El calendario gregoriano añade un día a febrero en los años bisiestos."),
  challenge("cultura-general", "facil", true, "El español escribe un signo de interrogación al inicio de las preguntas."),
  challenge("cultura-general", "intermedia", false, "El Premio Nobel de la Paz se entrega en Estocolmo."),
  challenge("cultura-general", "intermedia", true, "La Mona Lisa fue pintada por Leonardo da Vinci."),
  challenge("cultura-general", "intermedia", false, "El alfabeto latino clásico incluía la letra W."),
  challenge("cultura-general", "dificil", true, "Desde 2019, el kilogramo del Sistema Internacional se define con la constante de Planck."),
  challenge("cultura-general", "dificil", false, "El meridiano de Greenwich pasa por París."),
  challenge("cultura-general", "dificil", true, "La numeración maya clásica utilizaba un signo para el cero."),

  challenge("ciencias", "facil", true, "La molécula de agua está formada por hidrógeno y oxígeno."),
  challenge("ciencias", "facil", false, "Una célula somática humana típica tiene 23 cromosomas."),
  challenge("ciencias", "facil", true, "En el aire, la luz viaja más rápido que el sonido."),
  challenge("ciencias", "facil", false, "El corazón humano tiene tres cavidades."),
  challenge("ciencias", "intermedia", false, "Los electrones tienen carga eléctrica positiva."),
  challenge("ciencias", "intermedia", true, "La fotosíntesis de las plantas libera oxígeno."),
  challenge("ciencias", "intermedia", false, "Según la definición de la Unión Astronómica Internacional de 2006, Plutón es un planeta."),
  challenge("ciencias", "dificil", true, "El ADN humano utiliza las bases adenina, timina, citosina y guanina."),
  challenge("ciencias", "dificil", false, "Los neutrinos tienen carga eléctrica."),
  challenge("ciencias", "dificil", true, "Un átomo de carbono-12 tiene seis protones."),

  challenge("tecnologia", "facil", true, "HTML es un lenguaje de marcado."),
  challenge("tecnologia", "facil", false, "Una dirección IPv4 se escribe habitualmente con seis números separados por puntos."),
  challenge("tecnologia", "facil", true, "Wi-Fi es una tecnología de red inalámbrica."),
  challenge("tecnologia", "facil", false, "Un bit puede representar tres valores distintos."),
  challenge("tecnologia", "intermedia", false, "HTTP y HTTPS utilizan por defecto el mismo puerto."),
  challenge("tecnologia", "intermedia", true, "SQL significa Structured Query Language."),
  challenge("tecnologia", "intermedia", false, "El número binario 10 equivale a diez en decimal."),
  challenge("tecnologia", "dificil", true, "HTTPS protege la comunicación con el protocolo TLS."),
  challenge("tecnologia", "dificil", false, "Una dirección IPv6 tiene 64 bits."),
  challenge("tecnologia", "dificil", true, "En UTF-8, la letra A mayúscula ocupa un byte."),

  challenge("historia", "facil", true, "Cristóbal Colón llegó a América en 1492."),
  challenge("historia", "facil", false, "La Primera Guerra Mundial comenzó en 1939."),
  challenge("historia", "facil", true, "La Segunda Guerra Mundial terminó en 1945."),
  challenge("historia", "facil", false, "El primer alunizaje tripulado ocurrió en 1959."),
  challenge("historia", "intermedia", false, "La Revolución francesa comenzó en 1689."),
  challenge("historia", "intermedia", true, "El Muro de Berlín cayó en 1989."),
  challenge("historia", "intermedia", false, "Simón Bolívar nació en España."),
  challenge("historia", "dificil", true, "La Declaración de Independencia de los Estados Unidos es de 1776."),
  challenge("historia", "dificil", false, "El Imperio romano de Occidente cayó en 1453."),
  challenge("historia", "dificil", true, "Costa Rica abolió su ejército en 1948."),

  challenge("geografia", "facil", false, "El océano Atlántico es el océano más extenso de la Tierra."),
  challenge("geografia", "facil", false, "Lyon es la capital de Francia."),
  challenge("geografia", "facil", true, "El río Nilo se encuentra en África."),
  challenge("geografia", "facil", false, "Japón es un país sin salida al mar."),
  challenge("geografia", "intermedia", true, "Brasil es el país más extenso de América del Sur."),
  challenge("geografia", "intermedia", true, "El monte Everest es la cima más alta de la Tierra sobre el nivel del mar."),
  challenge("geografia", "intermedia", false, "Sídney es la capital de Australia."),
  challenge("geografia", "dificil", false, "Todas las mediciones oficiales coinciden en que el río Amazonas es el más largo del mundo."),
  challenge("geografia", "dificil", true, "Madagascar está en el océano Índico."),
  challenge("geografia", "dificil", true, "El Sahara es el desierto cálido más grande de la Tierra."),

  challenge("deportes", "facil", true, "Un partido de fútbol de tiempo reglamentario se divide en dos tiempos de 45 minutos."),
  challenge("deportes", "facil", true, "El baloncesto se juega con las manos."),
  challenge("deportes", "facil", false, "La distancia oficial de una maratón es de 21,097 kilómetros."),
  challenge("deportes", "facil", false, "El tenis se juega con un bate."),
  challenge("deportes", "intermedia", false, "Los primeros Juegos Olímpicos modernos se celebraron en París en 1896."),
  challenge("deportes", "intermedia", false, "En el voleibol, un equipo puede dar cuatro toques seguidos al balón, sin contar el bloqueo."),
  challenge("deportes", "intermedia", true, "En el ajedrez, cada jugador comienza con dieciséis piezas."),
  challenge("deportes", "dificil", true, "El Grand Slam de tenis reúne el Abierto de Australia, Roland Garros, Wimbledon y el Abierto de Estados Unidos."),
  challenge("deportes", "dificil", false, "En la Fórmula 1, la bandera a cuadros marca el inicio de la carrera."),
  challenge("deportes", "dificil", true, "Un partido de béisbol de entradas completas consta de nueve entradas."),
];

export function mergeByStatement(existingStatements: readonly string[], incoming: readonly ChallengeSeed[]) {
  const known = new Set(existingStatements);
  let created = 0;
  let updated = 0;
  for (const item of incoming) {
    if (known.has(item.statement)) {
      updated += 1;
    } else {
      created += 1;
      known.add(item.statement);
    }
  }
  return { created, updated, total: known.size };
}

export function toChallengePromptWrite(item: ChallengeSeed) {
  const data = {
    correctAnswer: item.correctAnswer,
    category: item.category,
    difficulty: item.difficulty,
    suggestedTimeLimitSeconds: item.suggestedTimeLimitSeconds,
  };
  return {
    where: { statement: item.statement },
    create: { statement: item.statement, imageUrl: null, ...data },
    update: data,
  };
}
