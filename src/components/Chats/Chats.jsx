import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../../App'
import { formatDate } from '../../helpers/dateFormat'
import Modal from '../Modal/Modal';
import UserAvatar from '../UserAvatar/UserAvatar'
import MenuDots from '../ui/MenuDots/MenuDots';
import './Chats.css'

const Chats = ({ chats }) => {
  const { authService, chatService, socketService, appSelectedChannel } = useContext(UserContext)
  const [channelInfo, setChannelInfo] = useState({name: '', description: ''})
  const [messages, setMessages] = useState([])
  const [editMessage, setEditMessage] =  useState({messageBody: ''})
  const [messageBody, setMessageBody] = useState('')
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [editModal, setEditModal] = useState(false)

  // subscribes to typing socket on page render
  useEffect(() => {
    socketService.getUserTyping((users) => {
      let names = ''
      let usersTyping = 0
      for (const [typingUser, chId] of Object.entries(users)) {
        if (typingUser !== authService.name && appSelectedChannel.id === chId) {
          names = (names === '' ? typingUser : `${names}, ${typingUser}`)
          usersTyping += 1
        }
      }
      if (usersTyping > 0) {
        const verb = (usersTyping > 1 ? 'are' : 'is')
        setTypingMessage(`${names} ${verb} typing a message...`)
      } else {
        setTypingMessage('')
      }
    })
  }, [appSelectedChannel])

    // loads only messages for this channel
    useEffect(() => {
      if (appSelectedChannel && appSelectedChannel.id) {
        chatService.findAllMessagesForChannel(appSelectedChannel.id)
        .then((res) => setMessages(res))
      }
    }, [appSelectedChannel])
  
  // sets channelInfo when user selects a new channel
  useEffect(() => {
    if (appSelectedChannel) {
      setChannelInfo(appSelectedChannel)
    }
  }, [appSelectedChannel])

    // updates chats anytime chats prop changes
  useEffect(() => {
    if (appSelectedChannel && appSelectedChannel.id) {
      chatService.findAllMessagesForChannel(appSelectedChannel.id)
      .then((res) => setMessages(res))
    }
  }, [chats, appSelectedChannel])

  const onTyping = ({ target: { value }}) => {
    if (!value.length) {
      setIsTyping(false)
      socketService.stopTyping(authService.name)
    } else if (!isTyping) {
      socketService.startTyping(authService.name, appSelectedChannel.id)
    } else {
      setIsTyping(true)
    }
    setMessageBody(value)
  }
  const onEdit = ({target: {name, value}}) => {
    setEditMessage({...editMessage, userName: authService.userName, userAvatar: authService.avatarName, userAvatarColor: authService.avatarColor, [name]: value})
  }
  const updateMessage = (e) => {
    e.preventDefault()
    socketService.editMessage(editMessage)
    chatService.updateMessage(editMessage)
    socketService.getUpdatedMessageListAfterMessageEdit((messageList) => {
      setMessages(messageList)
    })
    setEditModal(false)
  }
  const deleteSocket = () => {
    socketService.deleteMessage(editMessage.id)
    socketService.getUpdatedMessageList(appSelectedChannel.id, (messageList) => {
      setMessages(messageList)
    })
  }
  const deleteMessage = (e) => {
    e.preventDefault()
    deleteSocket()
    setEditMessage('')
    setEditModal(false)
  }
  const sendMessage = (e) => {
    e.preventDefault()
    const { name, id, avatarName, avatarColor } = authService
    const user = { 
      userName: name,
      userId: id, 
      userAvatar: avatarName,
      userAvatarColor: avatarColor,
    }
    socketService.addMessage(messageBody, appSelectedChannel.id, user)
    socketService.stopTyping(authService.name)
    setMessageBody('')
  }

  return (
    <>
      <div className="chat">
        <div className="chat-header">
          <h3>#{channelInfo.name ?? ''} - </h3>
          <h4>{channelInfo.description ?? ''}</h4>
        </div>
        <div className="chat-list">
          {!!messages.length ? messages.map((msg) => (
            <div key={msg.id} className="chat-message">
            <UserAvatar 
              avatar={{avatarName: msg.userAvatar, avatarColor: msg.userAvatarColor}} 
              size='md' 
            />
            <div className="chat-user">
              <small>{msg.userName}</small>
              <small>{formatDate(msg.timeStamp)}</small>
              <div className="message-body">
                {msg.messageBody}
              </div>
            </div>
            {authService.id === msg.userId ? (
              <span className="edit-message">
                <MenuDots 
                  open={() => {setEditModal(true); setEditMessage(msg)}}
                />
              </span>
            ) : null}
          </div>
          )) : (
            <div>No Messages</div>
          )}
        </div>
        <form onSubmit={sendMessage} className="chat-bar">
          <div className="typing">{typingMessage}</div>
          <div className='chat-wrapper'>
            <textarea
              onChange={onTyping}
              value={messageBody}
              placeholder={!(appSelectedChannel && appSelectedChannel.id) ? 'create a channel' : 'type a message...'}
              disabled={!(appSelectedChannel && appSelectedChannel.id)}
            />
            <input type="submit" className='submit-btn' value="Send" />
          </div>
        </form>
      </div>

      <Modal title="Edit Message" isOpen={editModal} close={() => setEditModal(false)} >
        <form className="form channel-form" onSubmit={updateMessage}>
          {/* <small style={{marginBottom: '10px', marginLeft: '10px'}}>{formatDate(timeStamp)}</small> */}
          <input onChange={onEdit} type="text" className="form-control" name="messageBody" value={editMessage.messageBody} />
          <input type="submit" className="submit-btn" value="Save Changes" />
          <br />
          <button onClick={deleteMessage} className="submit-btn logout-btn" value="Delete Channel">Delete Message</button>
        </form>
      </Modal>
    </>
  )
}

export default Chats