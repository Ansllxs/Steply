export const groups = [
  {
    id: 'compu-squad',
    name: 'Compu squad',
    members: 12,
    isAdmin: true,
    habits: [
      {
        id: 'estudiar',
        title: 'Estudiar',
        status: '8 de 12 completaron hoy',
        icon: 'cap',
      },
      {
        id: 'hacer-ejercicio',
        title: 'Hacer ejercicio',
        status: '6 de 12 completaron hoy',
        icon: 'activity',
      },
    ],
    ranking: [
      { place: 1, name: 'Valentina', points: 320 },
      { place: 2, name: 'Diego', points: 290 },
      { place: 3, name: 'Angie', points: 250, current: true },
      { place: 4, name: 'Sofía', points: 200 },
      { place: 5, name: 'Carlos', points: 180 },
    ],
  },
  {
    id: 'habitos-healthy',
    name: 'Hábitos healthy',
    members: 8,
    isAdmin: false,
    habits: [
      {
        id: 'caminar',
        title: 'Caminar',
        status: '5 de 8 completaron hoy',
        icon: 'activity',
      },
      {
        id: 'dormir',
        title: 'Dormir temprano',
        status: '3 de 8 completaron hoy',
        icon: 'book',
      },
    ],
    ranking: [
      { place: 1, name: 'Lucía', points: 410 },
      { place: 2, name: 'Mateo', points: 360 },
      { place: 3, name: 'Angie', points: 250, current: true },
      { place: 4, name: 'Renata', points: 190 },
    ],
  },
  {
    id: 'study-buddies',
    name: 'Study buddies',
    members: 6,
    isAdmin: false,
    habits: [
      {
        id: 'repasar',
        title: 'Repasar apuntes',
        status: '4 de 6 completaron hoy',
        icon: 'book',
      },
    ],
    ranking: [
      { place: 1, name: 'Elena', points: 280 },
      { place: 2, name: 'Andrés', points: 240 },
      { place: 3, name: 'Angie', points: 210, current: true },
    ],
  },
  {
    id: 'grupo-nuevo',
    name: 'Nuevo grupo',
    members: 1,
    isAdmin: true,
    habits: [],
    ranking: [],
  },
]

export function administrableGroups() {
  return groups.filter((group) => group.isAdmin)
}

export function findGroup(id) {
  return groups.find((group) => group.id === id)
}
