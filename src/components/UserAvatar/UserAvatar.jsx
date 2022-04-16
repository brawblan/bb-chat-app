import React, { useContext } from 'react'
import { UserContext } from '../../App';
import PropTypes from 'prop-types'
import './UserAvatar.css'

const UserAvatar = ({avatar, className, size}) => {
  const { authService } = useContext(UserContext)
  const {avatarName, avatarColor} = avatar

  return (
    <img
      className={`avatar-icon ${className} ${size}`}
      style={{ backgroundColor: avatarColor || authService.avatarColor}} 
      src={avatarName ? `/assets/images/${avatarName}` : `/assets/images/${authService.avatarName}`} 
      alt="avatar" 
    />
  )
}

UserAvatar.prototype = {
  className: PropTypes.string,
  size: PropTypes.string,
  avatar: PropTypes.object,
}

UserAvatar.defaultProps = {
  className: '',
  size: 'lg',
  avatar: {},
}

export default UserAvatar