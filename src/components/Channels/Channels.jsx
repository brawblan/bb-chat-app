/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react'
import { UserContext } from '../../App'
import { toCamelCase } from '../../helpers/camelCase';
import Modal from '../Modal/Modal';
import MenuDots from '../ui/MenuDots/MenuDots'
import './Channels.css'

const Channels = ({ unread }) => {
  const INIT = {name: '', description: ''}
  const [channels, setChannels] = useState([])
  const [unreadChannels, setUnreadChannels] = useState([])
  const [newChannel, setNewChannel] = useState(INIT)
  const [editChannel, setEditChannel] =  useState(INIT)
  const [modal, setModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const { authService, chatService, socketService, appSetChannel, appSelectedChannel } = useContext(UserContext)
  
  // updates unread state whenever unread prop changes
  useEffect(() => {
    setUnreadChannels(unread)
  }, [unread])

  // gets all channels and then sets selected as the first one on page render
  useEffect(() => {
    chatService.findAllChannels()
      .then((res) => {
        setChannels(res)
        appSetChannel(res[0])
      })
  }, [])

  // subscribes to channels, updates if a channel is added
  useEffect(() => {
    socketService.getChannel((channelList) => {
      setChannels(channelList)
    })
  }, [])
  
  // subscribes to channels, updates if a channel is deleted
  useEffect(() => {
    socketService.getUpdatedChannelList((channelList) => {
      setChannels(channelList)
    })
  }, [socketService])

  const selectChannel = (channel) => () => {
    appSetChannel(channel)
    setEditChannel(channel)
    const unread = chatService.setUnreadChannels(channel)
    setUnreadChannels(unread)
  }
  const onChange = ({target: {name, value}}) => {
    setNewChannel({...newChannel, [name]: value})
  }
  const onEdit = ({target: {name, value}}) => {
    setEditChannel({...editChannel, [name]: value})
  }
  const updateChannel = (e) => {
    e.preventDefault()
    const camelChannel = toCamelCase(editChannel.name)
    socketService.editChannel(camelChannel, editChannel.description, editChannel.id)
    chatService.updateChannelInformation(camelChannel, editChannel.description, editChannel.id)
    socketService.getUpdatedChannel(camelChannel, editChannel.description, editChannel.id, (channelList) => {
      setChannels(channelList)
    })
    setDeleteModal(false)
  }
  const deleteChannel = (e) => {
    e.preventDefault()
    socketService.deleteChannel(editChannel.id)
    socketService.getUpdatedChannelList((channelList) => {
      setChannels(channelList)
    })
    appSetChannel(chatService.channels[0])
    setDeleteModal(false)
  }
  const createChannel = (e) => {
    e.preventDefault()
    const camelChannel = toCamelCase(newChannel.name)
    socketService.addChannel(camelChannel, newChannel.description)
    setNewChannel(INIT)
    setModal(false)
  }

  return (
    <>
      <div className="channel">
        <div className="channel-header">
          <h3 className="channel-label">{authService.name}</h3>
        </div>
        <h3 className="channel-label">Channels <span onClick={() => setModal(true)}>Add +</span></h3>
        <div className="channel-list">
          {!!channels.length ? (
            channels.map((channel) => (
              <div
                key={channel.id} 
                onClick={selectChannel(channel)}
                className={`channel-label ${unreadChannels.includes(channel.id) ? 'unread' : ''}`}
              >
                <div className={`inner ${appSelectedChannel.id === channel.id ? 'selected' : ''}`}>
                  <div>#{channel.name}</div>
                  <MenuDots 
                    open={() => setDeleteModal(true)}
                    noMenuDots={appSelectedChannel.id === channel.id} 
                  />
                </div>
              </div>
            ))
          ) : (
            <div>No Channels. Please add a channel.</div>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      <Modal title="Create Channel" isOpen={modal} close={() => {setModal(false); setNewChannel(INIT)}} >
          <form className="form channel-form" onSubmit={createChannel}>
            <input onChange={onChange} type="text" className="form-control" name="name" placeholder="Enter Channel Name" />
            <input onChange={onChange} type="text" className="form-control" name="description" placeholder="Enter Channel Description" />
            <input type="submit" className="submit-btn" value="Create Channel" />
          </form>
      </Modal>

      {/* Edit Channel Modal */}
      <Modal title="Edit Channel" isOpen={deleteModal} close={() => setDeleteModal(false)} >
          <form className="form channel-form" onSubmit={updateChannel}>
            <input onChange={onEdit} type="text" className="form-control" name="name" value={editChannel.name} />
            <input onChange={onEdit} type="text" className="form-control" name="description" value={editChannel.description} />
            <input type="submit" className="submit-btn" value="Save Changes" />
            <br />
            <button onClick={deleteChannel} className="submit-btn logout-btn" value="Delete Channel">Delete Channel</button>
          </form>
      </Modal>
    </>
  )
}

export default Channels