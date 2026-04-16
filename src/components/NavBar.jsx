const BellIcon = () => (
  <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export default function NavBar({ activePage = 'briefs' }) {
  const links = ['Studio', 'Briefs', 'Settings']

  return (
    <nav className="vf-nav">
      <span className="vf-nav-logo">VibeFramer</span>

      <div className="vf-nav-links">
        {links.map(link => (
          <span
            key={link}
            className={`vf-nav-link${activePage === link.toLowerCase() ? ' vf-nav-link-active' : ''}`}
          >
            {link}
          </span>
        ))}
      </div>

      <div className="vf-nav-icons">
        <span className="vf-nav-icon"><BellIcon /></span>
        <span className="vf-nav-icon"><UserIcon /></span>
      </div>
    </nav>
  )
}
