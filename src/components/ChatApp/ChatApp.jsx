import React, { useState, useEffect, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './ChatApp.css'
import UserAvatar from '../UserAvatar/UserAvatar';
import Modal from '../Modal/Modal';
import Channels from '../Channels/Channels';
import Chats from '../Chats/Chats';
import Alert from '../Alert/Alert';
import { AVATARS_DARK, AVATARS_LIGHT } from '../../constants';

const ChatApp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { authService, chatService, socketService } = useContext(UserContext)

  const [userInfo, setUserInfo] = useState({})
  const [navInfo, setNavInfo] = useState({})
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark')
  const [avatarModal, setAvatarModal] = useState(false)

  const [modal, setModal] = useState(false)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [editUserModal, setEditUserModal] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [unreadChannels, setUnreadChannels] = useState([])
  
  const {userName, email, avatarName, avatarColor} = userInfo
  
  // set state for userInfo and navInfo (keeps page from breaking if no channels)
  // connects/disconnects from socket
  useEffect(() => {
    setUserInfo({
      userName: authService.name,
      email: authService.email,
      avatarName: authService.avatarName,
      avatarColor: authService.avatarColor
    })
    setNavInfo({
      userName: authService.name,
      avatarName: authService.avatarName,
      avatarColor: authService.avatarColor
    })
    socketService.establishConnection()
    return () => socketService.closeConnection()
  }, [])

  // connects to update message socket on page render
  useEffect(() => {
    updateMessageInfo()
  }, [])

  // adds new message to channel, applies unread state to channel title if unseen
  useEffect(() => {
    socketService.getChatMessage((newMessage) => {
      if (newMessage.channelId === chatService.selectedChannel.id) {
        setChatMessages([...chatService.messages])
      }
      if (chatService.unreadChannels.length) {
        setUnreadChannels(chatService.unreadChannels)
      }
    })
  }, [])

  // updates messages when deleted
  useEffect(() => {
    socketService.getUpdatedChannelList((messages) => {
      setChatMessages(messages)
    })
  }, [socketService])

  const onChange = ({target: {name, value}}) => {
    setUserInfo({...userInfo, [name]: value})
  }
  const generateBgColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16)
    setUserInfo({...userInfo, avatarColor: `#${randomColor}`})
  }
  const chooseAvatar = (avatar) => {
    setUserInfo({...userInfo, avatarName: avatar})
    setAvatarModal(false)
  }
  const openDeleteModal = () => {
    setModal(false)
    setDeleteUserModal(true)
  }
  const openEditModal = () => {
    setModal(false)
    setEditUserModal(true)
  }
  const logoutUser = () => {
    authService.logoutUser()
    setModal(false)
    navigate('/login', {from: {location}})
  }
  const updateMessageInfo = () => {
    chatService.getAllMessagesByUserId(authService.id)
      .then((res) => {
        res.forEach((message) => {
          const body = {
            id: message._id, 
            messageBody: message.messageBody,
            userId: authService.id, 
            channelId: message.channelId,
            userName: userName, 
            userAvatar: avatarName, 
            userAvatarColor: avatarColor
          }
          socketService.editMessage(body)
          chatService.updateMessage(body)
        })
      })
      .then(() => {
        socketService.getUpdatedMessageListAfterMessageEdit((messageList) => {
          setChatMessages(messageList)
        })
      })
  }
  const editUser = (e) => {
    e.preventDefault()
    const response = authService.editUser({
      userId: authService.id, 
      name: userName, 
      email, 
      avatarName, 
      avatarColor
    })
    updateMessageInfo()
    setNavInfo(userInfo, response.body)
    setEditUserModal(false)
  }
  const deleteUser = () => {
    authService.deleteUser()
    setDeleteUserModal(false)
    navigate('/login', {from: {location}})
  }
  const errorMsg = 'Error creating account. Please try again.'

  return (
    <div className="chat-app">
      <nav>
        <h1>Chat App</h1>
        <div className="user-avatar" onClick={() => setModal(true)}>
          <UserAvatar avatar={{avatarName: navInfo.avatarName, avatarColor: navInfo.avatarColor}} size={'sm'} className={'nav-avatar'} />
          <div>{navInfo.userName}</div>
        </div>
      </nav>

      <div className="smack-app">
        <Channels unread={unreadChannels} />
        <Chats chats={chatMessages} />
      </div>

      {/* Profile Information Modal */}
      <Modal title="Profile" isOpen={modal} close={() => setModal(false)}>
        <div className="profile">
          <UserAvatar avatar={{avatarName, avatarColor}} />
          <h4>Username: {userName}</h4>
          <h4>Email: {email}</h4>
        </div>
        <div className='profile-btns'>
          <button onClick={openEditModal} className="submit-btn">Edit</button>
          <button onClick={openDeleteModal} className="submit-btn delete-btn">Delete</button>
          <button onClick={() => logoutUser()} className="submit-btn logout-btn">Logout</button>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal title="Edit Profile" isOpen={editUserModal} close={() => setEditUserModal(false)}>
        {error ? <Alert message={errorMsg} type="alert-danger" /> : null}
        {isLoading ? <div>Loading...</div> : null}
        <form onSubmit={editUser} className="profile edit">
          <input 
            type="text"
            value={userName}
            className="form-control" 
            name="userName" 
            placeholder="Enter Username" 
            onChange={onChange}
          />
          <input 
            type="email"
            value={email}
            className="form-control" 
            name="email" 
            placeholder="Enter Email" 
            onChange={onChange}
          />
          <div className="avatar-container">
            <UserAvatar avatar={{avatarName, avatarColor}} className="create-avatar" />
            <div onClick={() => setAvatarModal(true)} className="avatar-text">Choose avatar</div>
            <div onClick={() => generateBgColor()} className="avatar-text">Generate background color</div>
          </div>
          <button type="submit" className="submit-btn">Edit Profile</button>
        </form>
      </Modal>

      {/* Delete Profile Modal */}
      <Modal title="Delete Profile" isOpen={deleteUserModal} close={() => setDeleteUserModal(false)}>
        <div className="profile">
          This action cannot be undone. Are you sure you would like to continue?
          Click the "Delete Profile" button to delete if you are sure, otherwise exit out of this modal.
        </div>
        <button onClick={() => deleteUser()} className="submit-btn delete-btn">Delete Profile</button>
      </Modal>

      {/* Avatar Selection Modal */}
      <Modal title="Choose Avatar" isOpen={avatarModal} close={() => setAvatarModal(false)}>
        <div className="switch-field">
          <input 
            onClick={() => setSelectedTheme('dark')} 
            type="radio" 
            id="radio-one" 
            name="switch-one" 
            value="dark"
            checked={selectedTheme === 'dark'} 
          />
          <label htmlFor="radio-one">Dark</label>
          <input 
            onClick={() => setSelectedTheme('light')} 
            type="radio" 
            id="radio-two" 
            name="switch-one" 
            value="light" 
            checked={selectedTheme === 'light'} 
          />
          <label htmlFor="radio-two">Light</label>
        </div>
          <div className="avatar-list">
            {(selectedTheme === 'dark' ? AVATARS_DARK : AVATARS_LIGHT).map((img) => (
              <div role="presentation" key={img} className={`create-avatar ${selectedTheme}`} onClick={() => chooseAvatar(img)} >
                <img src={`/assets/images/${img}`} alt="avatar" />
              </div>
            ))}
        </div>
      </Modal>
    </div>
  )
}

export default ChatApp