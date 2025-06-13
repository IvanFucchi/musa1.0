/**
 * Costruisce una query MongoDB per la ricerca di spot
 * @param {Object} params - Parametri di ricerca
 * @param {Object} user - Utente corrente (per controlli di autorizzazione)
 * @returns {Object} Query MongoDB
 */
export const buildSpotQuery = (params, user = null) => {
  const { search, type, category, mood, musicGenre, lat, lng, distance } = params;
  
  // Inizializza l'oggetto query
  let query = {};

  // Aggiungi condizioni di ricerca se presenti
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Aggiungi filtri per tipo e categoria se presenti
  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  // Aggiungi filtri per mood e genere musicale se presenti
  if (mood) {
    query.mood = { $in: [mood] };
  }

  if (musicGenre) {
    query.musicGenres = { $in: [musicGenre] };
  }

 // Aggiungi filtro geografico se presenti lat, lng e distance
if (lat && lng && distance) {
  try {
    // Assicurati che i valori siano numeri
    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const maxDistance = parseFloat(distance) * 1000; // Converti km in metri
    
    // Verifica che i valori siano validi
    if (isNaN(longitude) || isNaN(latitude) || isNaN(maxDistance)) {
      console.error('Coordinate o distanza non valide:', { lng, lat, distance });
    } else {
      // Usa $geoWithin invece di $near per evitare la necessità di un indice
      query.coordinates = {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            maxDistance / 6378100 // Converti metri in radianti (raggio della Terra = 6378.1 km)
          ]
        }
      };
    }
  } catch (error) {
    console.error('Errore nella costruzione della query geografica:', error);
  }
}


  // Aggiungi filtro per approvazione (mostra solo spot approvati a meno che l'utente non sia admin)
  if (!user || user.role !== 'admin') {
    query.isApproved = true;
  }

  return query;
};

/**
 * Costruisce opzioni di paginazione per le query MongoDB
 * @param {Object} params - Parametri di paginazione
 * @returns {Object} Opzioni di paginazione
 */
export const buildPaginationOptions = (params) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = params;
  
  return {
    skip: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit),
    sort
  };
};

export default {
  buildSpotQuery,
  buildPaginationOptions
};
