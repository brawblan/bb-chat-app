import React from 'react'
import './MenuDots.scss'

const MenuDots = ({noMenuDots, open}) => {
  return (
    <div onClick={open} className={`${!noMenuDots ? 'no-display-menu-dots' : ''} dot-menu`}><span></span></div>
  )
}

export default MenuDots