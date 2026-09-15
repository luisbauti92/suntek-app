import { LanguageProvider } from './contexts/LanguageContext';
import { CatalogPage } from './pages/CatalogPage';

function App() {
  return (
    <LanguageProvider>
      <CatalogPage />
    </LanguageProvider>
  );
}

export default App;
