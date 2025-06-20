// Semantic Matching Utils - Utilità per il matching semantico contestuale
// Aiuta a distinguere tra diversi significati di parole ambigue (es. Roma città vs Roma etnia)

/**
 * Classifica il contesto semantico di un testo rispetto a un luogo
 * @param {string} text - Testo da analizzare
 * @param {string} place - Nome del luogo
 * @returns {string} - Classificazione del contesto ('geographic_relevant', 'other_context', 'uncertain')
 */
export const classifySemanticContext = (text, place) => {
  // Normalizza il testo
  const normalizedText = text.toLowerCase();
  const normalizedPlace = place.toLowerCase();
  
  // Dizionario di contesti semantici per luoghi comuni
  const semanticContexts = {
    'roma': {
      geographic: ['città', 'city', 'capitale', 'capital', 'italy', 'italia', 'lazio', 'roman', 'romano', 'rome'],
      ethnic: ['gypsy', 'romani', 'gitano', 'zingaro', 'nomad', 'traveller', 'rom', 'sinti']
    },
    'rome': {
      geographic: ['città', 'city', 'capitale', 'capital', 'italy', 'italia', 'lazio', 'roman', 'romano', 'roma'],
      ethnic: ['gypsy', 'romani', 'gitano', 'zingaro', 'nomad', 'traveller', 'rom', 'sinti']
    },
    'paris': {
      geographic: ['france', 'francia', 'city', 'città', 'capitale', 'capital', 'seine', 'senna'],
      other: ['hilton', 'fashion', 'moda']
    },
    'florence': {
      geographic: ['italy', 'italia', 'tuscany', 'toscana', 'firenze'],
      other: ['nightingale', 'nurse']
    },
    'firenze': {
      geographic: ['italy', 'italia', 'tuscany', 'toscana', 'florence'],
      other: []
    },
    'venice': {
      geographic: ['italy', 'italia', 'veneto', 'venezia', 'canal', 'canale'],
      other: ['beach', 'california']
    },
    'venezia': {
      geographic: ['italy', 'italia', 'veneto', 'venice', 'canal', 'canale'],
      other: []
    }
    // Altri luoghi possono essere aggiunti qui
  };
  
  // Se abbiamo un contesto semantico per questo luogo
  if (semanticContexts[normalizedPlace]) {
    const context = semanticContexts[normalizedPlace];
    
    // Controlla se il testo contiene parole del contesto geografico
    const hasGeographicContext = context.geographic.some(word => normalizedText.includes(word));
    
    // Controlla se il testo contiene parole di altri contesti
    const hasOtherContext = context.ethnic?.some(word => normalizedText.includes(word)) || 
                           context.other?.some(word => normalizedText.includes(word));
    
    // Se ha contesto geografico e non ha altri contesti, è probabilmente rilevante
    if (hasGeographicContext && !hasOtherContext) {
      return 'geographic_relevant';
    }
    
    // Se ha altri contesti, è probabilmente non rilevante
    if (hasOtherContext) {
      return 'other_context';
    }
  }
  
  // Default: incerto
  return 'uncertain';
};

/**
 * Filtra i risultati in base al contesto semantico
 * @param {Array} results - Array di risultati da filtrare
 * @param {string} place - Nome del luogo
 * @returns {Array} - Array di risultati filtrati
 */
export const filterBySemanticContext = (results, place) => {
  // Se non abbiamo un luogo o risultati, restituisci i risultati originali
  if (!place || !results || results.length === 0) {
    return results;
  }
  
  const normalizedPlace = place.toLowerCase();
  
  // Lista di luoghi che potrebbero avere ambiguità semantiche
  const ambiguousPlaces = ['roma', 'rome', 'paris', 'florence', 'firenze', 'venice', 'venezia'];
  
  // Se il luogo non è ambiguo, restituisci i risultati originali
  if (!ambiguousPlaces.includes(normalizedPlace)) {
    return results;
  }
  
  // Filtra i risultati in base al contesto semantico
  return results.filter(item => {
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const artist = (item.artist || '').toLowerCase();
    
    // Combina tutti i testi per l'analisi
    const combinedText = `${title} ${description} ${artist}`;
    
    // Classifica il contesto semantico
    const context = classifySemanticContext(combinedText, normalizedPlace);
    
    // Mantieni solo i risultati con contesto geografico o incerto
    return context !== 'other_context';
  });
};

/**
 * Genera termini di ricerca con qualificatori geografici
 * @param {string} name - Nome del luogo o dell'opera
 * @param {string} place - Nome della città
 * @param {string} type - Tipo di luogo (museo, monumento, ecc.)
 * @returns {Array} - Array di termini di ricerca qualificati
 */
export const generateQualifiedSearchTerms = (name, place, type = '') => {
  const terms = [];
  
  // Termine base
  terms.push(`${name} ${place}`);
  
  // Aggiungi qualificatori in base al tipo
  switch (type.toLowerCase()) {
    case 'monument':
    case 'monumento':
      terms.push(`${name} monument ${place}`);
      terms.push(`${name} architecture ${place}`);
      break;
    case 'church':
    case 'chiesa':
      terms.push(`${name} church ${place}`);
      terms.push(`${name} cathedral ${place}`);
      break;
    case 'museum':
    case 'museo':
      terms.push(`${name} museum ${place}`);
      terms.push(`${name} gallery ${place}`);
      break;
    case 'palace':
    case 'palazzo':
      terms.push(`${name} palace ${place}`);
      terms.push(`${name} building ${place}`);
      break;
    default:
      // Qualificatori generici
      terms.push(`${name} landmark ${place}`);
      terms.push(`${name} attraction ${place}`);
  }
  
  return terms;
};

export default {
  classifySemanticContext,
  filterBySemanticContext,
  generateQualifiedSearchTerms
};

