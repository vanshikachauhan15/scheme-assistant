import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { getGoogleClientId } from './lib/googleClientId.js'

const googleClientId = getGoogleClientId()

export default function Root() {
  const tree = (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  if (!googleClientId) return tree
  return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
}
