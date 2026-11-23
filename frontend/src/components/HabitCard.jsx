import { Link } from 'react-router-dom'
import activityIcon from '../assets/icon-activity.svg'
import bookIcon from '../assets/icon-book.svg'
import calendarIcon from '../assets/icon-calendar.svg'
import capIcon from '../assets/icon-cap.svg'
import dropIcon from '../assets/icon-drop.svg'
import groupsIcon from '../assets/icon-groups.svg'
import nextIcon from '../assets/icon-next.svg'
import profileIcon from '../assets/icon-profile.svg'
import settingsIcon from '../assets/icon-settings.svg'

const icons = {
  activity: activityIcon,
  book: bookIcon,
  calendar: calendarIcon,
  cap: capIcon,
  drop: dropIcon,
  groups: groupsIcon,
  profile: profileIcon,
  settings: settingsIcon,
}

export default function HabitCard({ habit, to, onClick }) {
  const destination = to === undefined ? `/habits/${habit.id}` : to
  const content = (
    <>
      <span className="habit-card-icon">
        <img src={icons[habit.icon]} alt="" width="20" height="20" />
      </span>
      <span className="habit-card-copy">
        <span className="habit-card-title">{habit.title}</span>
        <span className="habit-card-status">{habit.status}</span>
      </span>
      <span className="habit-card-meta">
        {habit.progress ? (
          <span className="habit-card-progress">{habit.progress}</span>
        ) : null}
        <img src={nextIcon} alt="" width="16" height="16" />
      </span>
    </>
  )

  return (
    <li>
      {destination ? (
        <Link className="habit-card" to={destination}>
          {content}
        </Link>
      ) : onClick ? (
        <button type="button" className="habit-card" onClick={onClick}>
          {content}
        </button>
      ) : (
        <div className="habit-card">{content}</div>
      )}
    </li>
  )
}
