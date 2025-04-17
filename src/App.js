import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState(null);

  //FOR POKEMONS...
  const [loading, setLoading] = useState(false);
  const [allPokemon, setAllPokemon] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);

  //FOR NAVIGATION PURPOSES
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [genFilter, setGenFilter] = useState("All");
  const [selectedGen, setSelectedGen] = useState("both");

  const pokemonPerPage = 8;
  //LIMIT TO GEN 2
  const maxPokedexId = 251;

  const pokemonTypes = [
    "All",
    "Normal",
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
  ];

  useEffect(() => {
    const fetchAllPokemon = async () => {
      try {
        setLoading(true);

        //ERROR HANDLING IF FAILED TO LOAD
        const promises = [];
        for (let i = 1; i <= maxPokedexId; i++) {
          promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then((res) =>
              res.json()
            )
          );
        }

        const results = await Promise.all(promises);

        //GET CHAIN
        const speciesResults = results.map((p) =>
          fetch(p.species.url).then((res) => res.json())
        );

        const speciesData = await Promise.all(speciesResults);
        const pokemonSpecies = results.map((p, index) => {
          const genNumber = speciesData[index].generation.name
            .split("-")[1]
            .toUpperCase();

          return {
            id: p.id,
            name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
            types: p.types.map((type) => type.type.name),
            sprite: p.sprites.front_default,
            height: p.height,
            weight: p.weight,
            evolutionUrl: speciesData[index].evolution_chain.url,
            generation: genNumber,
            isGen1: genNumber === "I",
            isGen2: genNumber === "II",
          };
        });

        setAllPokemon(pokemonSpecies);
        setFilteredPokemon(pokemonSpecies);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load Pokemon data! ${err.message}`);
        setLoading(false);
      }
    };

    fetchAllPokemon();
  }, []);

  useEffect(() => {
    let filtered = [...allPokemon];

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "All") {
      filtered = filtered.filter((p) =>
        p.types.includes(typeFilter.toLowerCase())
      );
    }

    if (genFilter !== "All") {
      filtered = filtered.filter((p) => p.generation === genFilter);
    }

    if (selectedGen === "gen1") {
      filtered = filtered.filter((p) => p.isGen1);
    } else if (selectedGen === "gen2") {
      filtered = filtered.filter((p) => p.isGen2);
    }

    setFilteredPokemon(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, genFilter, selectedGen, allPokemon]);

  //PAGE NAVIGATIONS
  const indexLastPokemon = currentPage * pokemonPerPage;
  const indexFirstPokemon = indexLastPokemon - pokemonPerPage;
  const currentPokemon = filteredPokemon.slice(
    indexFirstPokemon,
    indexLastPokemon
  );
  const totalPages = Math.ceil(filteredPokemon.length / pokemonPerPage);

  const fetchPokemonDetails = async (name) => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
      );

      if (!response.ok) {
        throw new Error("Pokemon not found!");
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
        for (const evo1 of currentEvolution.evolves_to) {
          if (evo1.species.name.toLowerCase() === name.toLowerCase()) {
            if (evo1.evolves_to.length > 0) {
              nextEvolution = evo1.evolves_to[0].species.name;
            }
            break;
          }

          for (const evo2 of evo1.evolves_to) {
            if (evo2.species.name.toLowerCase() === name.toLowerCase()) {
              break;
            }
          }
        }
      }

      baseEvolution =
        baseEvolution.charAt(0).toUpperCase() + baseEvolution.slice(1);
      if (nextEvolution) {
        nextEvolution =
          nextEvolution.charAt(0).toUpperCase() + nextEvolution.slice(1);
      }

      const generation = speciesData.generation.name
        .split("-")[1]
        .toUpperCase();

      setPokemon({
        ...data,
        baseEvolution,
        nextEvolution,
        generation,
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

  const handlePokemonSelect = (nameOrEvent) => {
    const pokemonName = typeof nameOrEvent === 'object' && nameOrEvent.target ?
                          nameOrEvent.target.value : nameOrEvent;
    fetchPokemonDetails(pokemonName);
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
    normal: "bg-gray-300",
    fire: "bg-red-500 text-white",
    water: "bg-blue-500 text-white",
    grass: "bg-green-500 text-white",
    electric: "bg-yellow-400",
    ice: "bg-blue-200",
    fighting: "bg-red-700 text-white",
    poison: "bg-purple-500 text-white",
    ground: "bg-yellow-600 text-white",
    flying: "bg-blue-300",
    psychic: "bg-pink-500 text-white",
    bug: "bg-green-600 text-white",
    rock: "bg-yellow-700 text-white",
    ghost: "bg-purple-700 text-white",
    dragon: "bg-purple-600 text-white",
    dark: "bg-gray-800 text-white",
    steel: "bg-gray-400",
    fairy: "bg-pink-300",
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Pokédex</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 font-medium">Search Pokémon:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Search Pokémon"
            value={searchTerm}
            onChange={handleSubmit}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Filter by Type:</label>
          <select
            className="w-full p-2 border rounded"
            value={typeFilter}
            onChange={handleType}
          >
            {pokemonTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Filter by Generation:
          </label>
          <select
            className="w-full p-2 border rounded"
            value={genFilter}
            onChange={handleGen}
          >
            <option value="All">All</option>
            <option value="I">Gen I</option>
            <option value="II">Gen II</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="both-gens"
              name="gen-selection"
              value="both"
              checked={selectedGen === "both"}
              onChange={handleGenSelect}
              className="mr-2"
            />
            <label htmlFor="both-gens">All</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="gen1"
              name="gen-selection"
              value="gen1"
              checked={selectedGen === "gen1"}
              onChange={handleGenSelect}
              className="mr-2"
            />
            <label htmlFor="gen1">Gen I</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="gen2"
              name="gen-selection"
              value="gen2"
              checked={selectedGen === "gen2"}
              onChange={handleGenSelect}
              className="mr-2"
            />
            <label htmlFor="gen2">Gen II</label>
          </div>
        </div>
      </div>

      {loading && !pokemon && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      {/* Pokemon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        {currentPokemon.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePokemonSelect(p.name)}
          >
            <div className="flex justify-center">
              <img src={p.sprite} alt={p.name} className="h-24 w-24" />
            </div>
            <h3 className="text-lg font-semibold text-center">{p.name}</h3>
            <div className="flex justify-center mt-2">
              {p.isGen1 && (
                <span
                  className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"
                  title="Gen I"
                ></span>
              )}
              {p.isGen2 && (
                <span
                  className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"
                  title="Gen II"
                ></span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mb-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          onClick={goToPrevPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Selected Pokemon details */}
      {pokemon && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2">
                {formatName(pokemon.name)}
              </h2>
              <img
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
                className="h-48 w-48"
              />
              <div className="flex mt-2 space-x-2">
                {pokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    className={`px-3 py-1 rounded-full text-sm ${
                      typeColors[type.type.name] || "bg-gray-200"
                    }`}
                  >
                    {type.type.name.charAt(0).toUpperCase() +
                      type.type.name.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Pokémon Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Height:</strong> {pokemon.height / 10}m
                  </p>
                  <p>
                    <strong>Weight:</strong> {pokemon.weight / 10}kg
                  </p>
                  <p>
                    <strong>Generation:</strong> {pokemon.generation} 📅
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Base Evolution:</strong> {pokemon.baseEvolution} 🐣
                  </p>
                  <p>
                    <strong>Next Evolution:</strong>{" "}
                    {pokemon.nextEvolution || "Final Form"} 🔄
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-4 mb-2">Base Stats</h3>
              <div className="space-y-2">
                {pokemon.stats.map((stat) => (
                  <div key={stat.stat.name} className="flex items-center">
                    <span className="w-24 font-medium">
                      {formatStatName(stat.stat.name)}:
                    </span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatColor(stat.base_stat)}`}
                        style={{
                          width: `${Math.min(
                            100,
                            (stat.base_stat / 150) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 w-8 text-right">
                      {stat.base_stat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatName(statName) {
  switch (statName) {
    case "hp":
      return "HP";
    case "attack":
      return "Attack";
    case "defense":
      return "Defense";
    case "special-attack":
      return "Sp. Atk";
    case "special-defense":
      return "Sp. Def";
    case "speed":
      return "Speed";
    default:
      return statName;
  }
}

function getStatColor(value) {
  if (value < 50) return "bg-red-500";
  if (value < 80) return "bg-yellow-500";
  if (value < 100) return "bg-green-500";
  return "bg-blue-500";
}

export default App;