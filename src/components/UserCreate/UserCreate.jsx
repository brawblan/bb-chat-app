import React, { useState, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './UserCreate.css'
import { UserContext } from '../../App';
import Modal from '../Modal/Modal';
import { AVATARS_DARK, AVATARS_LIGHT } from '../../constants';
import Alert from '../Alert/Alert';
import UserAvatar from '../UserAvatar/UserAvatar';

const UserCreate = () => {
  const { authService } = useContext(UserContext)
  const location = useLocation()
  const navigate = useNavigate()
  const INIT_STATE = {
    userName: '',
    email: '',
    password: '',
    avatarName: 'avatarDefault.png',
    avatarColor: ''
  }
  const [userInfo, setUserInfo] = useState(INIT_STATE)
  const [modal, setModal] = useState(false)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark')

  const onChange = ({target: {name, value}}) => {
    setUserInfo({...userInfo, [name]: value})
  }

  const chooseAvatar = (avatar) => {
    setUserInfo({...userInfo, avatarName: avatar})
    setModal(false)
  }

  const generateBgColor = () => {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16)
    setUserInfo({...userInfo, avatarColor: `#${randomColor}`})
  }

  const createUser = (e) => {
    e.preventDefault()
    const { from } = location.state || { from: { pathname: '/' }}
    if (!!userName && !!email && !!password) {
      setIsLoading(true)
      authService.registerUser(email, password).then(() => {
        authService.loginUser(email, password).then(() => {
          authService.createUser(userName, email, avatarName, avatarColor).then(() => {
            setUserInfo(INIT_STATE)
            navigate(from)
          })
          .catch((error) => {
            console.error('creating user', error)
            setError(true)
          })
        })
        .catch((error) => {
          console.error('logging in user', error)
          setError(true)
        })
      })
      .catch((error) => {
        console.error('registering user', error)
        setError(true)
      })
      setIsLoading(false)
    }
  }

  const errorMsg = 'Error creating account. Please try again.'

  const {userName, email, password, avatarName, avatarColor} = userInfo
  return (
    <>
      <div className="center-display">
        {error ? <Alert message={errorMsg} type="alert-danger" /> : null}
        {isLoading ? <div>Loading...</div> : null}
        <h3 className="title">Create an account</h3>
        <form onSubmit={createUser} className="form">
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
          <input 
            type="password"
            value={password}
            className="form-control" 
            name="password" 
            placeholder="Enter Password" 
            onChange={onChange}
          />
          <div className="avatar-container">
            <UserAvatar avatar={{avatarName, avatarColor}} className="create-avatar" />
            <div onClick={() => setModal(true)} className="avatar-text">Choose avatar</div>
            <div onClick={() => generateBgColor()} className="avatar-text">Generate background color</div>
          </div>
          <input type="submit" className="submit-btn" value="Create account" />
        </form>
        <div className="footer-text">
          Already have an Account? Login <Link to="/login"> HERE</Link>
        </div>
      </div>

      <Modal title="Choose Avatar" isOpen={modal} close={() => setModal(false)}>
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
    </>
  )
}

export default UserCreate