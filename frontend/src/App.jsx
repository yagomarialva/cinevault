import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import MovieModal from './components/MovieModal';

function App() {
  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home onMovieSelect={setSelectedMovie} />} />
        <Route path="/search" element={<Search onMovieSelect={setSelectedMovie} />} />
      </Routes>
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={true}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}

export default App;
