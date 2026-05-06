import { StrictMode, Component } from 'react'
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
import { BannersProvider } from './context/BannersContext'
import { BrandProvider } from './context/BrandContext'
import { CollectionsProvider } from './context/CollectionsContext'
import { DiscountsProvider } from './context/DiscountsContext'
import { PagesProvider } from './context/PagesContext'
import { AnnouncementsProvider } from './context/AnnouncementsContext'
import { PromoProvider } from './context/PromoContext'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: 'red', background: '#fff' }}>
          <h2>App crashed — error details:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
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
                          <BrandProvider>
                            <BannersProvider>
                              <CollectionsProvider>
                                <DiscountsProvider>
                                  <PagesProvider>
                                    <AnnouncementsProvider>
                                      <PromoProvider>
                                        <App />
                                      </PromoProvider>
                                    </AnnouncementsProvider>
                                  </PagesProvider>
                                </DiscountsProvider>
                              </CollectionsProvider>
                            </BannersProvider>
                          </BrandProvider>
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
    </ErrorBoundary>
  </StrictMode>,
)
