import React, { useState, useContext} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import Alert from '../Alert/Alert';

const UserLogin = () => {
  const { authService } = useContext(UserContext)
  const [userLogins, setUserLogins] = useState({email: '', password: ''})
  const [error, setError] = useState('')

  const location = useLocation()
  const navigate = useNavigate()

  const onLoginUser = (e) => {
    e.preventDefault() 
    const { email, password } = userLogins
    if (!!email && !!password) {
      const { from } = location.state || { from: { pathname: '/' }}
      authService.loginUser(email, password)
        .then(() => navigate(from, { replace: true }))
        .catch((error) => {
          setError(error)
          setUserLogins({ email: '', password: '' })
        })
    }
  }


  const onChange = ({ target: {name, value}}) => {
    setUserLogins({...userLogins, [name]: value})
  }

  const errorMsg = "Sorry, you entered an incorrect email or password"

  return (
    <div className="center-display">
      {error ? <Alert message={errorMsg} type='alert-danger' /> : null}
      <form onSubmit={onLoginUser} className="form">
        <label htmlFor="credentials">Enter your <strong>email address</strong> and <strong>password</strong></label>
      <input
        onChange={onChange} 
        value={userLogins.email}
        type="email" 
        className="form-control" 
        name="email" 
        placeholder='person@person.com' 
      />
      <input 
        onChange={onChange} 
        value={userLogins.password}
        type="password" 
        className="form-control" 
        name="password" 
        placeholder='password' 
      />
        <input id="credentials" type="submit" className="submit-btn" value="Sign In" />
      </form>
      <div className="footer-text">
        No Account? Create one! <Link to="/create"> HERE</Link>
      </div>
    </div>
  )
}

export default UserLogin