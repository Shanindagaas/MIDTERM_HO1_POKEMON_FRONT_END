import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState(null); 

  //FOR POKEMONS...
  const [loading, setLoading] = useState(false);
  const [allPokemon, setAllPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);

  //FOR NAVIGATION PURPOSES
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [genFilter, setGenFilter] = useState('All');
  const [selectedGen, setSelectedGen] = useState('both');

  const pokemonPerPage = 8;
  //LIMIT TO GEN 2
  const maxPokedexId = 251;

  const pokemonTypes = [
    'All', 'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ]

  useEffect(() => {
    const fetchAllPokemon = async () => {
      try {
        setLoading(true);
        
        //ERROR HANDLING IF FAILED TO LOAD
        const promises = [];
        for (let i = 1; i <= maxPokedexId; i++) {
          response.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
        }

        const results = await Promise.all(promises);

        //GET CHAIN
        const speciesResults = results.map(p =>
            fetch(p.species.ur).then(res => res.json())
        );

        const speciesData = await Promise.all(speciesResults);
        const pokemonSpecies = results.map((p, index) => {
          const genNumber = speciesData[index].generation.name.split('-')[1].toUpperCase();

          return {
            id: p.id,
            name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
            types: p.types.map(type => type.type.name),
            sprite: p.sprites.front_default,
            height: p.height,
            weight: p.weight,
            evolutionUrl: speciesData[index].evolution_chain.url,
            generation: genNumber,
            isGen1: genNumber === 'I',
            isGen2: genNumber === 'II',
          };
        });

        setAllPokemon(pokemonSpecies);
        setFilteredPokemon(pokemonSpecies);
        setLoading(false);
      } catch (err) {
        setError("Failed to load Pokemon data!");
        setLoading(false);
      } 
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.elements.pokemonName.value.trim();
    if (name) {
      fetchPokemon(name);
    }
  };

  return (
    <div className="App">
      <h1>Pokémon Search</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="pokemonName" placeholder="Enter Pokémon name" required />
        <button type="submit">Search</button>
      </form>
      {error && <p>{error}</p>}
      {pokemon && (
        <div className="pokemon-details">
          <h2>{pokemon.name}</h2>
          <img src={pokemon.sprites.front_default} alt={pokemon.name} />
          <p><strong>Height:</strong> {pokemon.height}</p>
          <p><strong>Weight:</strong> {pokemon.weight}</p>
          <p><strong>Type:</strong> {pokemon.types.map(type => type.type.name).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default App;
