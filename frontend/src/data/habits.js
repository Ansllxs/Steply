export const habits = [
  {
    id: 'leer',
    title: 'Leer',
    scope: 'personal',
    status: 'Personal · Diario',
    progress: '0/1',
    icon: 'book',
  },
  {
    id: 'tomar-agua',
    title: 'Tomar agua',
    scope: 'personal',
    status: 'Personal · Diario',
    progress: '1/1',
    icon: 'drop',
  },
  {
    id: 'estudiar',
    title: 'Estudiar',
    scope: 'group',
    status: 'Compu squad · Diario',
    progress: '0/1',
    icon: 'cap',
  },
]

export const habitFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'personal', label: 'Personales' },
  { id: 'group', label: 'Grupales' },
]

export const weekDays = [
  { id: 'l', label: 'L', name: 'Lunes' },
  { id: 'm', label: 'M', name: 'Martes' },
  { id: 'x', label: 'X', name: 'Miércoles' },
  { id: 'j', label: 'J', name: 'Jueves' },
  { id: 'v', label: 'V', name: 'Viernes' },
  { id: 's', label: 'S', name: 'Sábado' },
  { id: 'd', label: 'D', name: 'Domingo' },
]

export const habitDetails = {
  leer: {
    subtitle: 'Diario · Hábito personal',
    week: [true, true, true, false, false, false, false],
    streak: '3 días',
    points: '120',
  },
  'tomar-agua': {
    subtitle: 'Diario · Hábito personal',
    week: [false, false, false, false, false, false, false],
    streak: '0 días',
    points: '0',
  },
  estudiar: {
    subtitle: 'Diario · Compu squad',
    week: [false, false, false, false, false, false, false],
    streak: '0 días',
    points: '0',
  },
}

export const checkInDateLabel = '5 de octubre de 2026'

export const calendarStart = { year: 2026, month: 9, day: 5 }

export const registeredDates = ['2026-10-01', '2026-10-02', '2026-10-03']

export const calendarHabits = {
  '2026-10-05': [
    {
      id: 'leer',
      title: 'Leer',
      status: 'Pendiente de registro',
      progress: '0/1',
      icon: 'book',
    },
  ],
}
