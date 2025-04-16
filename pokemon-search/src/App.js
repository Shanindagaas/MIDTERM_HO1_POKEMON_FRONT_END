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
    };

    fetchAllPokemon();
  }, []);

  useEffect(() => {
    let filtered = [...allPokemon];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(p => 
        p.types.includes(typeFilter.toLowerCase())
      );
    }

    if (genFilter !== 'All') {
      filtered = filtered.filter(p =>
        p.generation === genFilter
      );
    }

    if (selectedGen === 'gen1') {
      filtered = filtered.filter(p =>
        p.isGen1
      );
    } else if (selectedGen === 'gen2') {
      filtered = filtered.filter(p =>
        p.isGen2
      );
    }

    setFilteredPokemon(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, genFilter, selectedGen, allPokemon]);

  //PAGE NAVIGATIONS
  const indexLastPokemon = currentPage * pokemonPerPage;
  const indexFirstPokemon = indexLastPokemon - pokemonPerPage;
  const currentPokemon = filteredPokemon.slice(indexFirstPokemon, indexLastPokemon);
  const totalPages = Math.ceil(filteredPokemon.length / pokemonPerPage);

  const fetchPokemonDetails = async (name) => {
    try {
      setLoading(true);

      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);

      if (!response.ok) {
        throw new Error ('Pokemon not found!');
      }

      const data = await response.json();

      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();

      const evolutionResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionData = await evolutionResponse.json();

      let baseEvolution = evolutionData.chain.species.name;

      let nextEvolution = null;
      let currentEvolution = evolutionData.chain;

      if (currentEvolution.species.name.toLowerCase() === name.toLowerCase()) {
        if (currentEvolution.evolves_to.length > 0) {
          nextEvolution = currentEvolution.evolves_to[0].species.name;
        }
      } else {
        for (const evo1 of currentEvolution.evoles_to) {
          if (evo1.species.name.toLowerCase() === name.toLowerCase()) {
            if (evo1.evolves_to.length > 0) {
              nextEvolution = evo1.evolves_to[0].species.name;
            }
            break;
          }

          for (const evo2 of evo1.evoles_to) {
            if (evo2.species.name.toLowerCase() === name.toLowerCase()) {
              break;
            }
          }
        }
      }

      baseEvolution = baseEvolution.charAt(0).toUpperCase() + baseEvolution.slice(1);
      if (nextEvolution) {
        nextEvolution = nextEvolution.charA(0).toUpperCase() + nextEvolution.slice(1);
      }

      const generation = speciesData.generation.name.split('-')[1].toUpperCase();

      setPokemon({
        ...data,
        baseEvolution,
        nextEvolution,
        generation
      });

      setError(null);
      setLoading(false);
    } catch (err) {
      setPokemon(null);
      setError(err.message);
      setLoading(false);
    }
  };


  const handleSubmit = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleType = (e) => {
    setTypeFilter(e.target.value);
  };

  const handleGen = (e) => {
    setGenFilter(e.target.value);
  };

  const handleGenSelect = (e) => {
    setSelectedGen(e.target.value);
  };

  const handlePokemonSelect = (e) => {
    fetchPokemonDetails(name);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const typeColors = {
    normal: 'bg-gray-300',
    fire: 'bg-red-500 text-white',
    water: 'bg-blue-500 text-white',
    grass: 'bg-green-500 text-white',
    electric: 'bg-yellow-400',
    ice: 'bg-blue-200',
    fighting: 'bg-red-700 text-white',
    poison: 'bg-purple-500 text-white',
    ground: 'bg-yellow-600 text-white',
    flying: 'bg-blue-300',
    psychic: 'bg-pink-500 text-white',
    bug: 'bg-green-600 text-white',
    rock: 'bg-yellow-700 text-white',
    ghost: 'bg-purple-700 text-white',
    dragon: 'bg-purple-600 text-white',
    dark: 'bg-gray-800 text-white',
    steel: 'bg-gray-400',
    fairy: 'bg-pink-300'
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
