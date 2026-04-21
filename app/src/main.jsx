import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { OrdersProvider } from './context/OrdersContext'
import { ReviewsProvider } from './context/ReviewsContext'
import { NotifProvider } from './context/NotifContext'
import { LangProvider } from './context/LangContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <CatalogProvider>
              <CartProvider>
                <WishlistProvider>
                  <OrdersProvider>
                    <ReviewsProvider>
                      <NotifProvider>
                        <App />
                      </NotifProvider>
                    </ReviewsProvider>
                  </OrdersProvider>
                </WishlistProvider>
              </CartProvider>
            </CatalogProvider>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
)
