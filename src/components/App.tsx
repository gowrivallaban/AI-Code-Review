import { AppProvider } from '../context';
import { Router } from './Router';
import { NotificationContainer } from './NotificationContainer';
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router />
        <NotificationContainer />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
