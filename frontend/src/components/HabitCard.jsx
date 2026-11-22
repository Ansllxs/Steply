import bookIcon from '../assets/icon-book.svg'
import capIcon from '../assets/icon-cap.svg'
import dropIcon from '../assets/icon-drop.svg'
import nextIcon from '../assets/icon-next.svg'

const icons = {
  book: bookIcon,
  cap: capIcon,
  drop: dropIcon,
}

export default function HabitCard({ habit }) {
  return (
    <li>
      <button type="button" className="habit-card">
        <span className="habit-card-icon">
          <img src={icons[habit.icon]} alt="" width="20" height="20" />
        </span>
        <span className="habit-card-copy">
          <span className="habit-card-title">{habit.title}</span>
          <span className="habit-card-status">{habit.status}</span>
        </span>
        <span className="habit-card-meta">
          <span className="habit-card-progress">{habit.progress}</span>
          <img src={nextIcon} alt="" width="16" height="16" />
        </span>
      </button>
    </li>
  )
}
