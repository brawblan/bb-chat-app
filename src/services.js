import axios from 'axios'
import io from 'socket.io-client'

// const BASE_URL = 'http://localhost:3005/v1'
const BASE_URL = 'https://mac-chat-api-brandon-updates.herokuapp.com/'

// accounts
const URL_ACCOUNT = `${BASE_URL}/account`
const URL_LOGIN = `${URL_ACCOUNT}/login`
const URL_REGISTER = `${URL_ACCOUNT}/register`

// messages
const URL_GET_MESSAGES = `${BASE_URL}/message/byChannel/`
const URL_EDIT_MESSAGE = `${BASE_URL}/message/`
const URL_DELETE_MESSAGE = `${BASE_URL}/message/`
const URL_GET_MESSAGES_USER_ID = `${URL_EDIT_MESSAGE}byUser/`

// channels
const URL_GET_CHANNELS = `${BASE_URL}/channel`
const URL_EDIT_CHANNEL = `${BASE_URL}/channel/`

// users
const URL_USER = `${BASE_URL}/user/`
const URL_USER_ADD = `${URL_USER}/add`
const URL_USER_BY_EMAIL = `${URL_USER}/byEmail`

const headers = {'Content-Type': 'application/json'}

class User {
  constructor() {
    this.id = ''
    this.name = ''
    this.email = ''
    this.avatarName = 'avatarDefault.png'
    this.avatarColor = ''
    this.isLoggedIn = false
  }

  setUserEmail(email) { this.email = email }
  setIsLoggedIn(loggedIn) { this.isLoggedIn = loggedIn }

  setUserData(userData) {
    const { _id, name, email, avatarName, avatarColor } = userData
    this.id = _id
    this.name = name
    this.email = email
    this.avatarName = avatarName
    this.avatarColor = avatarColor
  }
}

export class AuthService extends User {
  constructor() {
    super()
    this.authToken = ''
    this.bearerHeader = {}
  }

  logoutUser() {
    this.id = ''
    this.name = ''
    this.email = ''
    this.avatarName = ''
    this.avatarColor = ''
    this.isLoggedIn = false
    this.authToken = ''
    this.bearerHeader = {}
  }

  #setAuthToken(token) { this.authToken = token }
  #setBearerHeader(token) { 
    this.bearerHeader = {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${token}`
    }
  }

  getBearerHeader = () => this.bearerHeader

  async registerUser(email, password) {
    const body = {
      "email": email.toLowerCase(),
      "password": password
    }

    try {
      await axios.post(URL_REGISTER, body)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async createUser(name, email, avatarName, avatarColor) {
    const headers = this.getBearerHeader()
    const body = {
      "name": name,
      "email": email,
      "avatarName": avatarName,
      "avatarColor": avatarColor
    }

    try {
      const response = await axios.post(URL_USER_ADD, body, { headers })
      this.setUserData(response.data)
    } catch (error) {
      throw error
    }
  }

  async loginUser(email, password) {
    const body = {
      "email": email.toLowerCase(),
      "password": password
    }

    try {
      const response = await axios.post(URL_LOGIN, body, { headers })
      this.#setAuthToken(response.data.token)
      this.#setBearerHeader(response.data.token)
      this.setUserEmail(response.data.user)
      this.setIsLoggedIn(true)
      await this.findUserByEmail()
    } catch(error) {
      console.error(error)
      throw error
    }
  }

  async findUserByEmail() {
    const headers = this.getBearerHeader()
    try {
      const response = await axios.get(`${URL_USER_BY_EMAIL}/${this.email}`, { headers })
      this.setUserData(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  async deleteUser() {
    const headers = this.getBearerHeader()
    const userId = this.id
    const userEmail = this.email

    try {
      const userResponse = await axios.delete(`${URL_USER}${userId}`, { headers })
      const accountResponse = await axios.delete(`${URL_ACCOUNT}/${userEmail}`, { headers })
      return [userResponse, accountResponse]
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async editUser(request) {
    const headers = this.getBearerHeader()
    const {userId, name, email, avatarName, avatarColor} = request

    const body = {
      "name": name,
      "email": email,
      "avatarName": avatarName,
      "avatarColor": avatarColor
    }
    
    const stateBody = {
      name,
      email,
      avatarName,
      avatarColor
    }
    
    try {
      const response = await axios.put(`${URL_USER}${userId}`, body, { headers })
      
      this.name = name
      this.email = email
      this.avatarName = avatarName
      this.avatarColor = avatarColor

      return [response, stateBody]
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export class ChatService {
  constructor(authHeader) { 
    this.getAuthHeader = authHeader
    this.selectedChannel = {}
    this.channels = []
    this.unreadChannels = []
    this.messages = []
  }

  addChannel = (channel) => this.channels.push(channel)
  addMessage = (chat) => this.messages.push(chat)
  setSelectedChannel = (channel) => this.selectedChannel = channel
  getSelectedChannel = () => this.selectedChannel
  getAllChannels = () => this.channels

  addToUnread = (urc) => this.unreadChannels.push(urc)
  setUnreadChannels = (channel) => {
    if (this.unreadChannels.includes(channel.id)) {
      this.unreadChannels = this.unreadChannels.filter(ch => ch !== channel.id)
    }
    return this.unreadChannels
  }
  
  // messages
  async deleteMessageById(messageId) {
    const endpoint = `${URL_DELETE_MESSAGE}${messageId}`
    const headers = this.getAuthHeader()

    try {
      const response = await axios.delete(endpoint, { headers })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async findAllMessagesForChannel(channelId) {
    const headers = this.getAuthHeader()

    try {
      let response = await axios.get(`${URL_GET_MESSAGES}${channelId}`, { headers })
      response = response.data.map((msg) => ({
        messageBody: msg.messageBody,
        channelId: msg.channelId,
        userId: msg.userId,
        id: msg._id,
        userName: msg.userName,
        userAvatar: msg.userAvatar,
        userAvatarColor: msg.userAvatarColor,
        timeStamp: msg.timeStamp
      }))
      this.messages = response
      return response
    } catch (error) {
      console.error(error)
      this.messages = []
      throw error
    }
  }
  async updateMessage(messageInfo) {
    const {id, messageBody, userId, channelId, userName, userAvatar, userAvatarColor} = messageInfo
    const endpoint = `${URL_EDIT_MESSAGE}${id}`
    const body = {
      'messageBody': messageBody,
      'userId': userId,
      'channelId': channelId,
      'userName': userName,
      'userAvatar': userAvatar,
      'userAvatarColor': userAvatarColor,
    }
    const headers = this.getAuthHeader()

    try {
      const response = await axios.put(endpoint, body, { headers })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async getAllMessagesByUserId(userId) {
    const endpoint = `${URL_GET_MESSAGES_USER_ID}${userId}`
    const headers = this.getAuthHeader()

    try {
      const response = await axios.get(endpoint, { headers })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  
  // channels
  async findAllChannels() {
    const headers = this.getAuthHeader()

    try {
      let response = await axios.get(`${URL_GET_CHANNELS}`, { headers })
      response = response.data.map((channel) => ({
        name: channel.name,
        description: channel.description,
        id: channel._id,
      }))
      this.channels = [...response]
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async updateChannelInformation(name, description, channelId) {
    const endpoint = `${URL_EDIT_CHANNEL}${channelId}`
    const body = {
      "name": name,
      "description": description
    }
    const headers = this.getAuthHeader()

    try {
      const response = await axios.put(endpoint, body, { headers })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  async deleteChannelById(channelId) {
    const endpoint = `${URL_EDIT_CHANNEL}${channelId}`
    const headers = this.getAuthHeader()

    try {
      const response = await axios.delete(endpoint, { headers })
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export class SocketService {
  socket = io(`http://localhost:3005/`)
  constructor(chatService) {
    this.chatService = chatService
  }

  // socket connect/disconnet
  establishConnection() {
    console.log('client connect');
    this.socket.connect()
  }
  closeConnection() {
    console.log('client disconnect');
    this.socket.disconnect()
  }

  // messages
  addMessage(messageBody, channelId, user) {
    const { userName, userId, userAvatar, userAvatarColor } = user
    if (!!messageBody && !!channelId && !!user) {
      this.socket.emit('newMessage', messageBody, userId, channelId, userName, userAvatar, userAvatarColor)
    }
  }
  getChatMessage(cb) {
    this.socket.on('messageCreated', (messageBody, userId, channelId, userName, userAvatar, userAvatarColor, id, timeStamp) => {
      const channel = this.chatService.getSelectedChannel()
      const chat = { messageBody, userId, channelId, userName, userAvatar, userAvatarColor, id, timeStamp }
      if (channelId !== channel.id && !this.chatService.unreadChannels.includes(channelId)) {
        this.chatService.addToUnread(channelId)
      }
      this.chatService.messages = [...this.chatService.messages, chat]
      cb(chat)
    })
  }
  editMessage(messageInfo) {
    this.socket.emit('messageUpdated', messageInfo)
  }
  getUpdatedMessageListAfterMessageEdit(cb) {
    this.socket.on('userUpdatedMessage', ({channelId}) => {
      console.log(channelId);
      this.chatService.findAllMessagesForChannel(channelId)
        .then((res) => {
          cb(res)
        }) 
      })
  }
  deleteMessage(messageId) {
    this.socket.emit('messageDeleted', messageId)
  }  
  getUpdatedMessageList(channelId, cb) {
    this.socket.on('userDeletedMessage', (messageId) => {
      this.chatService.deleteMessageById(messageId)
        .then(() => {
          this.chatService.findAllMessagesForChannel(channelId)
            .then((res) => {
              cb(res)
            }) 
        })
    })
  }

  // channels
  addChannel(name, description) {
    this.socket.emit('newChannel', name, description)
  }
  getChannel(cb) {
    this.socket.on('channelCreated', (name, description, id) => {
      const channel = {name, description, id}
      this.chatService.addChannel(channel)
      const channelList = this.chatService.getAllChannels()
      cb(channelList)
    })
  }
  editChannel(name, description, channelId) {
    this.socket.emit('channelUpdated', name, description, channelId)
  }
  getUpdatedChannel(name, description, channelId, cb) {
    this.socket.on('userUpdatedChannel', () => {
      this.chatService.updateChannelInformation(name, description, channelId).then(() => {
        this.chatService.findAllChannels().then((res) => {
          cb(res)
        })
      })
    })
  }
  deleteChannel(channelId) {
    this.socket.emit('channelDeleted', channelId)
  }
  getUpdatedChannelList(cb) {
    this.socket.on('userDeletedChannel', (channelId) => {
      this.chatService.deleteChannelById(channelId)
        .then(() => {
          this.chatService.findAllChannels()
            .then((res) => {
              cb(res)
            })
        })
    })
  }

  // message typing socket
  startTyping(userName, channelId) {
    this.socket.emit('startType', userName, channelId)
  }
  stopTyping(userName) {
    this.socket.emit('stopType', userName)
  }
  getUserTyping(cb) {
    this.socket.on('userTypingUpdate',  (typingUsers) => {
      cb(typingUsers)
    })
  }
}
