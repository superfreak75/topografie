import { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, Polygon, Tooltip } from 'react-leaflet'
import { LatLng, Icon } from 'leaflet'
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Paper, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import confetti from 'canvas-confetti'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

type CategoryType = 'cities' | 'rivers' | 'regions';

interface BaseLocation {
  id: string
  name: string
  alternativeNames: string[]
  guessed?: boolean
  status?: 'correct' | 'incorrect' | null
}

interface City extends BaseLocation {
  type: 'city'
  position: [number, number]
}

interface River extends BaseLocation {
  type: 'river'
  coordinates: [number, number][] // Array van coördinaten voor de rivier
}

interface Region extends BaseLocation {
  type: 'region'
  coordinates: [number, number][][] // Array van polygoon coördinaten
}

const CITIES: City[] = [
  { 
    id: '1',
    type: 'city', 
    name: 'Hamburg', 
    alternativeNames: ['hamburg', 'hamborg'],
    position: [53.5511, 9.9937]
  },
  { 
    id: '2', 
    type: 'city', 
    name: 'Berlijn', 
    alternativeNames: ['berlijn', 'berlin'],
    position: [52.5200, 13.4050]
  },
  { 
    id: '3', 
    type: 'city', 
    name: 'Luxemburg', 
    alternativeNames: ['luxemburg', 'luxembourg'],
    position: [49.6116, 6.1319]
  },
  { 
    id: '4', 
    type: 'city', 
    name: 'Keulen', 
    alternativeNames: ['keulen', 'koln', 'köln'],
    position: [50.9375, 6.9603]
  },
  { 
    id: '5', 
    type: 'city', 
    name: 'München', 
    alternativeNames: ['munchen', 'münchen', 'muenchen'],
    position: [48.1351, 11.5820]
  },
  { 
    id: '6', 
    type: 'city', 
    name: 'Wenen', 
    alternativeNames: ['wenen', 'wien'],
    position: [48.2082, 16.3738]
  },
  { 
    id: '7', 
    type: 'city', 
    name: 'Parijs', 
    alternativeNames: ['parijs', 'paris'],
    position: [48.8566, 2.3522]
  },
  { 
    id: '8', 
    type: 'city', 
    name: 'Bordeaux', 
    alternativeNames: ['bordeaux'],
    position: [44.8378, -0.5792]
  },
  { 
    id: '9', 
    type: 'city', 
    name: 'Marseille', 
    alternativeNames: ['marseille'],
    position: [43.2965, 5.3698]
  },
  { 
    id: '10', 
    type: 'city', 
    name: 'Lyon', 
    alternativeNames: ['lyon'],
    position: [45.7640, 4.8357]
  },
  { 
    id: '11', 
    type: 'city', 
    name: 'Genève', 
    alternativeNames: ['geneve', 'genève', 'genf'],
    position: [46.2044, 6.1432]
  },
  { 
    id: '12', 
    type: 'city', 
    name: 'Bern', 
    alternativeNames: ['bern', 'berne'],
    position: [46.9480, 7.4474]
  },
]

const RIVERS: River[] = [
  {
    id: 'river1',
    type: 'river',
    name: 'Rijn',
    alternativeNames: ['rijn', 'rhein', 'rhine'],
    coordinates: [
      [51.9244, 4.4777],    // Rotterdam start
      [51.9156, 4.4889],    // Rotterdam centrum
      [51.9067, 4.5012],    // Rotterdam oost
      [51.8978, 4.5234],    // Richting Ridderkerk
      [51.8889, 4.5456],    // Ridderkerk
      [51.8801, 4.5678],    // Na Ridderkerk
      [51.8712, 4.5901],    // Voor Alblasserdam
      [51.8623, 4.6123],    // Alblasserdam
      [51.8534, 4.6345],    // Na Alblasserdam
      [51.8428, 4.9801],    // Gorinchem
      [51.8339, 5.0023],    // Na Gorinchem
      [51.8251, 5.0245],    // Richting Woudrichem
      [51.8162, 5.0468],    // Woudrichem
      [51.8073, 5.0690],    // Na Woudrichem
      [51.7984, 5.0912],    // Voor Zaltbommel
      [51.7895, 5.1134],    // Zaltbommel
      [51.7807, 5.1357],    // Na Zaltbommel
      [51.7718, 5.1579],    // Richting Tiel
      [51.7629, 5.1801],    // Voor Tiel
      [51.7540, 5.2023],    // Tiel
      [51.7534, 5.8717],    // Nijmegen
      [51.7445, 5.8939],    // Nijmegen centrum
      [51.7356, 5.9162],    // Nijmegen oost
      [51.7267, 5.9384],    // Na Nijmegen
      [51.7179, 5.9606],    // Richting Duitse grens
      [51.7090, 5.9829],    // Duitse grens
      [51.7001, 6.0051],    // Emmerich
      [51.6912, 6.0273],    // Na Emmerich
      [51.6823, 6.0495],    // Voor Wesel
      [51.6734, 6.0718],    // Wesel aanloop
      [51.6645, 6.0940],    // Wesel
      [51.6557, 6.1162],    // Na Wesel
      [51.6468, 6.1384],    // Richting Duisburg
      [51.6379, 6.1607],    // Voor Duisburg
      [51.6290, 6.1829],    // Duisburg noord
      [51.4556, 6.6218],    // Duisburg
      [51.4467, 6.6440],    // Duisburg zuid
      [51.4379, 6.6663],    // Na Duisburg
      [51.4290, 6.6885],    // Richting Düsseldorf
      [51.4201, 6.7107],    // Voor Düsseldorf
      [51.2289, 6.7726],    // Düsseldorf
      [51.2201, 6.7948],    // Na Düsseldorf
      [51.2112, 6.8171],    // Richting Keulen
      [51.2023, 6.8393],    // Voor Keulen
      [50.9375, 6.9603],    // Keulen
      [50.9286, 6.9825],    // Keulen centrum
      [50.9197, 7.0047],    // Keulen zuid
      [50.9109, 7.0270],    // Na Keulen
      [50.9020, 7.0492],    // Richting Bonn
      [50.7367, 7.0982],    // Bonn
      [50.7278, 7.1204],    // Na Bonn
      [50.7189, 7.1427],    // Voor Königswinter
      [50.7101, 7.1649],    // Königswinter
      [50.6012, 7.1871],    // Na Königswinter
      [50.5923, 7.2093],    // Richting Koblenz
      [50.5834, 7.2316],    // Voor Koblenz
      [50.3538, 7.5941],    // Koblenz
      [50.3449, 7.6163],    // Koblenz centrum
      [50.3361, 7.6386],    // Na Koblenz
      [50.3272, 7.6608],    // Richting Boppard
      [50.3183, 7.6830],    // Boppard
      [50.3094, 7.7052],    // Na Boppard
      [50.2005, 7.7275],    // Voor Bacharach
      [50.1917, 7.7497],    // Bacharach
      [50.1828, 7.7720],    // Na Bacharach
      [50.1739, 7.7942],    // Richting Bingen
      [50.1650, 7.8164],    // Voor Bingen
      [50.0379, 8.5622],    // Mainz
      [50.0290, 8.5844],    // Mainz centrum
      [50.0201, 8.6067],    // Na Mainz
      [50.0112, 8.6289],    // Richting Wiesbaden
      [50.0024, 8.6511],    // Wiesbaden
      [49.9935, 8.6734],    // Na Wiesbaden
      [49.9846, 8.6956],    // Voor Rüdesheim
      [49.9757, 8.7178],    // Rüdesheim
      [49.9668, 8.7401],    // Na Rüdesheim
      [49.9580, 8.7623],    // Richting Mannheim
      [49.5783, 8.4037],    // Mannheim
      [49.5694, 8.4259],    // Mannheim centrum
      [49.5605, 8.4482],    // Na Mannheim
      [49.5516, 8.4704],    // Richting Ludwigshafen
      [49.5428, 8.4926],    // Ludwigshafen
      [49.5339, 8.5149],    // Na Ludwigshafen
      [49.5250, 8.5371],    // Voor Speyer
      [49.5161, 8.5593],    // Speyer
      [49.0069, 8.4037],    // Karlsruhe
      [48.9980, 8.4259],    // Karlsruhe centrum
      [48.9891, 8.4482],    // Na Karlsruhe
      [48.9803, 8.4704],    // Richting Rastatt
      [48.9714, 8.4926],    // Rastatt
      [48.9625, 8.5149],    // Na Rastatt
      [48.9536, 8.5371],    // Voor Baden-Baden
      [48.9447, 8.5593],    // Baden-Baden
      [48.5734, 7.8053],    // Straatsburg
      [48.5645, 7.8275],    // Straatsburg centrum
      [48.5557, 7.8498],    // Na Straatsburg
      [48.5468, 7.8720],    // Richting Kehl
      [48.5379, 7.8942],    // Kehl
      [48.5290, 7.9165],    // Na Kehl
      [48.5201, 7.9387],    // Voor Offenburg
      [48.5112, 7.9609],    // Offenburg
      [47.5576, 7.5929],    // Basel
      [47.5487, 7.6152],    // Basel centrum
      [47.5399, 7.6374],    // Basel zuid
    ]
  },
  {
    id: 'river2',
    type: 'river',
    name: 'Donau',
    alternativeNames: ['donau', 'danube'],
    coordinates: [
      [48.3705, 10.8984], // Ulm
      [48.4084, 11.9917], // Freising
      [48.4700, 12.5300], // Landshut gebied
      [48.5200, 13.0400], // Vilshofen
      [48.5665, 13.4319], // Passau
      [48.4200, 13.8100], // Aschach
      [48.3069, 14.2871], // Linz
      [48.2500, 14.8900], // Grein
      [48.2205, 15.3256], // Melk
      [48.2082, 16.3738], // Wenen
      [48.1700, 16.9800], // Hainburg
      [48.1487, 17.1077], // Bratislava
      [47.9900, 17.3700], // Rajka
      [47.7984, 17.6350], // Győr
      [47.7500, 18.1200], // Komárom
      [47.7900, 18.7400], // Esztergom
      [47.5521, 19.0402], // Budapest Noord
      [47.4979, 19.0402], // Budapest
      [47.4300, 19.0300], // Budapest Zuid
      [46.9800, 18.9300], // Dunaújváros
      [46.6300, 18.8800], // Paks
      [46.2830, 18.9514], // Baja
      [45.9800, 18.7100], // Mohács
      [45.5489, 19.0489], // Apatin
      [45.2517, 19.8369], // Novi Sad
      [45.0000, 20.1000], // Stari Banovci
      [44.8048, 20.4781], // Belgrado
      [44.7200, 21.3800], // Ram
      [44.6623, 22.6571], // Iron Gates
      [44.2300, 22.5500], // Negotin
      [44.0252, 23.0245], // Calafat
      [43.7067, 24.8792], // Turnu Măgurele
      [43.7064, 25.6100], // Svistov
      [43.3964, 25.9536], // Ruse
      [43.3800, 27.9500], // Constanța
      [44.4200, 28.5200], // Sulina
    ]
  },
  {
    id: 'river3',
    type: 'river',
    name: 'Seine',
    alternativeNames: ['seine'],
    coordinates: [
      [49.4431, 0.1903],    // Le Havre - Start
      [49.4389, 0.2012],    // Le Havre haven
      [49.4352, 0.2156],    // Le Havre oostelijk deel
      [49.4341, 0.2298],    // Overgang naar Harfleur
      [49.4412, 0.2467],    // Harfleur
      [49.4489, 0.2612],    // Tussen Harfleur en Tancarville
      [49.4721, 0.2789],    // Aanloop Tancarville
      [49.4841, 0.3264],    // Tancarville
      [49.4852, 0.3398],    // Na Tancarville
      [49.4867, 0.3589],    // Bocht naar Quillebeuf
      [49.4872, 0.3789],    // Voor Quillebeuf
      [49.4794, 0.4023],    // Quillebeuf-sur-Seine
      [49.4756, 0.4256],    // Na Quillebeuf
      [49.4712, 0.4489],    // Bocht naar Vatteville
      [49.4689, 0.4723],    // Vatteville-la-Rue
      [49.4701, 0.4956],    // Na Vatteville
      [49.4794, 0.5189],    // Richting Notre-Dame
      [49.4812, 0.5423],    // Voor Notre-Dame
      [49.4794, 0.5656],    // Notre-Dame aanloop
      [49.4794, 0.7023],    // Notre-Dame-de-Gravenchon
      [49.4756, 0.7256],    // Na Notre-Dame
      [49.4689, 0.7489],    // Bocht naar Caudebec
      [49.4623, 0.7723],    // Voor Caudebec
      [49.4523, 0.7956],    // Caudebec-en-Caux
      [49.4412, 0.8189],    // Na Caudebec
      [49.4301, 0.8423],    // Richting Duclair
      [49.4189, 0.8656],    // Voor Duclair
      [49.4078, 0.8889],    // Duclair
      [49.3967, 0.9123],    // Na Duclair
      [49.3856, 0.9356],    // Bocht naar Rouen
      [49.3827, 0.9821],    // Rouen begin
      [49.3812, 1.0054],    // Rouen centrum
      [49.3789, 1.0287],    // Rouen einde
      [49.3678, 1.0521],    // Na Rouen
      [49.3567, 1.0754],    // Richting Poses
      [49.3456, 1.0987],    // Voor Poses
      [49.3345, 1.1221],    // Poses aanloop
      [49.3041, 1.2006],    // Poses
      [49.2967, 1.2239],    // Na Poses
      [49.2856, 1.2472],    // Bocht naar Les Andelys
      [49.2745, 1.2706],    // Voor Les Andelys
      [49.2634, 1.2939],    // Les Andelys aanloop
      [49.2410, 1.4123],    // Les Andelys
      [49.2299, 1.4356],    // Na Les Andelys
      [49.2188, 1.4589],    // Richting Vernon
      [49.2077, 1.4823],    // Voor Vernon
      [49.0886, 1.4801],    // Vernon
      [49.0775, 1.5034],    // Na Vernon
      [49.0664, 1.5267],    // Bocht naar Bonnières
      [49.0553, 1.5501],    // Voor Bonnières
      [49.0442, 1.5734],    // Bonnières-sur-Seine
      [49.0331, 1.5967],    // Na Bonnières
      [49.0220, 1.6201],    // Richting Mantes
      [49.0109, 1.6434],    // Voor Mantes
      [48.9998, 1.6667],    // Mantes aanloop
      [48.9886, 1.7149],    // Mantes-la-Jolie
      [48.9775, 1.7382],    // Na Mantes
      [48.9664, 1.7616],    // Bocht naar Meulan
      [48.9553, 1.7849],    // Voor Meulan
      [48.9442, 1.8082],    // Meulan aanloop
      [48.9401, 1.8521],    // Meulan
      [48.9290, 1.8754],    // Na Meulan
      [48.9179, 1.8987],    // Richting Poissy
      [48.9068, 1.9221],    // Voor Poissy
      [48.9352, 2.0551],    // Poissy
      [48.9241, 2.0784],    // Na Poissy
      [48.9130, 2.1017],    // Bocht naar Bezons
      [48.9019, 2.1251],    // Voor Bezons
      [48.9413, 2.1549],    // Bezons
      [48.9302, 2.1782],    // Na Bezons
      [48.9191, 2.2015],    // Richting Parijs
      [48.9080, 2.2249],    // Voor Parijs
      [48.8969, 2.2482],    // Parijs aanloop
      [48.8858, 2.2715],    // Parijs west
      [48.8747, 2.2949],    // Parijs centrum-west
      [48.8636, 2.3182],    // Parijs centrum
      [48.8566, 2.3522],    // Parijs
      [48.8455, 2.3755],    // Parijs centrum-oost
      [48.8344, 2.3988],    // Parijs oost
      [48.8233, 2.4222],    // Na Parijs
      [48.8183, 2.3839],    // Ivry-sur-Seine
      [48.8072, 2.4072],    // Na Ivry
      [48.7961, 2.4305],    // Richting Alfortville
      [48.7890, 2.3988],    // Alfortville
      [48.7779, 2.4221],    // Na Alfortville
      [48.7668, 2.4454],    // Bocht naar Villeneuve
      [48.7557, 2.4688],    // Voor Villeneuve
      [48.7446, 2.4921],    // Villeneuve aanloop
      [48.7294, 2.4086],    // Villeneuve-Saint-Georges
      [48.7183, 2.4319],    // Na Villeneuve
      [48.7072, 2.4552],    // Richting Corbeil
      [48.6961, 2.4786],    // Voor Corbeil
      [48.6850, 2.5019],    // Corbeil aanloop
      [48.6739, 2.5252],    // Voor Corbeil centrum
      [48.6628, 2.5486],    // Corbeil begin
      [48.5734, 2.4751],    // Corbeil-Essonnes
      [48.5623, 2.4984],    // Na Corbeil
      [48.5512, 2.5217],    // Laatste bocht
      [48.5401, 2.5451],    // Einde Seine
    ]
  },
  {
    id: 'river4',
    type: 'river',
    name: 'Rhône',
    alternativeNames: ['rhone', 'rhône'],
    coordinates: [
      [46.2044, 6.1432], // Genève
      [46.1800, 6.1200], // Zuidelijk van Genève
      [46.1500, 6.0800], // Begin van de bocht
      [46.1200, 6.0400], // Vervolg van de bocht
      [46.0800, 6.0000], // Aanloop naar Bellegarde
      [46.0500, 5.9300], // Bellegarde-sur-Valserine
      [46.0200, 5.8800], // Na Bellegarde
      [45.9800, 5.8200], // Bocht richting Culoz
      [45.9500, 5.7500], // Voor Culoz
      [45.9200, 5.6800], // Culoz begin
      [45.9000, 5.6200], // Culoz midden
      [45.8800, 5.5500], // Culoz eind
      [45.8500, 5.4800], // Na Culoz
      [45.8200, 5.4200], // Bocht naar Yenne
      [45.7900, 5.3800], // Yenne
      [45.7600, 5.3400], // Na Yenne
      [45.7400, 5.2800], // Voor Morestel
      [45.7200, 5.2200], // Morestel
      [45.7000, 5.1600], // Na Morestel
      [45.7200, 5.1000], // Bocht naar Lyon
      [45.7400, 5.0400], // Aanloop naar Lyon
      [45.7600, 4.9800], // Voor Lyon
      [45.7640, 4.8357], // Lyon
      [45.7400, 4.8200], // Lyon Zuid
      [45.7000, 4.8300], // Na Lyon
      [45.6500, 4.8400], // Richting Vienne
      [45.5800, 4.8700], // Voor Vienne
      [45.5200, 4.8700], // Vienne Noord
      [45.4800, 4.8300], // Vienne
      [45.4400, 4.8200], // Vienne Zuid
      [45.3800, 4.8100], // Na Vienne
      [45.3200, 4.8200], // Voor Saint-Vallier
      [45.2500, 4.8200], // Saint-Vallier
      [45.1800, 4.8300], // Na Saint-Vallier
      [45.1200, 4.8500], // Voor Tournon
      [45.0600, 4.8700], // Tournon-sur-Rhône
      [45.0000, 4.8800], // Voor Valence
      [44.9389, 4.8924], // Valence
      [44.8800, 4.8500], // Na Valence
      [44.8200, 4.8200], // Voor Montélimar
      [44.7600, 4.7800], // Aanloop Montélimar
      [44.5600, 4.7500], // Montélimar
      [44.4800, 4.7400], // Na Montélimar
      [44.3800, 4.7600], // Voor Viviers
      [44.2800, 4.7800], // Viviers
      [44.1378, 4.8057], // Orange
      [44.0800, 4.8100], // Na Orange
      [44.0200, 4.8200], // Voor Avignon
      [43.9493, 4.8055], // Avignon
      [43.9000, 4.7800], // Na Avignon
      [43.8500, 4.7200], // Voor Beaucaire
      [43.8000, 4.6500], // Beaucaire
      [43.7500, 4.6400], // Voor Arles
      [43.6805, 4.6332], // Arles
      [43.6300, 4.6200], // Begin delta
      [43.5800, 4.6100], // Delta midden
      [43.5300, 4.6300], // Delta splitsing
      [43.4800, 4.6500], // Petit Rhône
      [43.4300, 4.7000], // Grand Rhône
      [43.3738, 4.8055], // Bouches-du-Rhône
    ]
  },
  {
    id: 'river5',
    type: 'river',
    name: 'Het Kanaal',
    alternativeNames: ['het kanaal', 'english channel', 'la manche'],
    coordinates: [
      [51.0891, 1.4460],    // Dover Strait
      [50.9513, 1.2891],    // Calais
      [50.8000, 1.1000],    // Boulogne-sur-Mer
      [50.1891, -1.4000],   // Isle of Wight
      [49.7000, -2.0000],   // Cherbourg
      [48.8534, -3.0235],   // Lannion
      [48.7054, -4.6000],   // Brest
      [48.6000, -2.0000],   // Saint-Malo
      [49.5000, -1.2000],   // Normandische kust
      [49.7000, -0.3000],   // Le Havre
      [50.0000, 0.2000],    // Dieppe
      [50.5000, 0.8000],    // Tussen Frankrijk en Engeland
      [51.0891, 1.4460]     // Terug naar Dover Strait voor het sluiten van de polygon
    ]
  },
  {
    id: 'river6',
    type: 'river',
    name: 'Middellandse Zee',
    alternativeNames: ['middellandse zee', 'mediterranean sea', 'mediterranean'],
    coordinates: [
      [43.2965, 5.3698],    // Marseille
      [43.0000, 6.5000],    // Saint-Tropez gebied
      [42.3498, 3.0153],    // Perpignan
      [41.3851, 2.1734],    // Barcelona
      [40.8518, 14.2681],   // Napels
      [40.6333, 14.6023],   // Salerno
      [39.2238, 9.1217],    // Cagliari
      [41.0000, 7.0000],    // Corsica gebied
      [42.5000, 6.0000],    // Tussen Corsica en Frankrijk
    ]
  }
]

const REGIONS: Region[] = [
  {
    id: 'region1',
    type: 'region',
    name: 'Alpen',
    alternativeNames: ['alpen', 'alps'],
    coordinates: [[
      [47.8000, 6.0000],  // West Frankrijk
      [47.6000, 6.5000],  // Franse Alpen west
      [47.4000, 7.0000],  // Franse Alpen centraal
      [47.2000, 7.5000],  // Franse Alpen oost
      [47.0000, 8.0000],  // Zwitserse grens west
      [46.8000, 8.5000],  // Centraal Zwitserland
      [46.6000, 9.0000],  // Oost Zwitserland
      [46.8000, 9.5000],  // Liechtenstein gebied
      [47.0000, 10.0000], // West-Oostenrijk
      [47.2000, 11.0000], // Centraal Oostenrijk
      [47.4000, 12.0000], // Oost-Oostenrijk
      [47.6000, 13.0000], // Richting Wenen
      [47.8000, 14.0000], // Oostenrijkse Alpen oost
      [47.6000, 14.5000], // Zuidoostelijke curve
      [47.4000, 14.0000], // Zuidelijke Alpen oost
      [47.2000, 13.5000], // Zuidelijke Alpen centraal
      [47.0000, 13.0000], // Karawanken gebied
      [46.8000, 12.5000], // Dolomieten oost
      [46.6000, 12.0000], // Dolomieten centraal
      [46.4000, 11.5000], // Dolomieten west
      [46.2000, 11.0000], // Zuid-Tirol
      [46.0000, 10.5000], // Lombardische Alpen
      [45.8000, 10.0000], // Bergamo Alpen
      [45.6000, 9.5000],  // Zuidelijke uitlopers
      [45.8000, 9.0000],  // Zuidwestelijke curve
      [46.0000, 8.5000],  // Tessiner Alpen
      [46.2000, 8.0000],  // Monte Rosa gebied
      [46.4000, 7.5000],  // Walliser Alpen
      [46.6000, 7.0000],  // Berner Alpen
      [46.8000, 6.5000],  // Westelijke curve
      [47.0000, 6.2000],  // Jura gebied
      [47.8000, 6.0000]   // Terug naar start
    ]]
  },
  {
    id: 'region2',
    type: 'region',
    name: 'Pyreneeën',
    alternativeNames: ['pyreneeen', 'pyreneeën', 'pyrenees'],
    coordinates: [[
      [43.3619, -1.7798], // Start bij Atlantische kust
      [43.2000, -1.2000], // Zachte curve naar binnen
      [43.0000, -0.7000], // Westelijke Pyreneeën
      [42.8982, -0.2148], // Centrale westelijke deel
      [42.7000, 0.5000],  // Natuurlijke curve centraal
      [42.4972, 1.9116],  // Centrale Pyreneeën
      [42.3500, 2.5000],  // Oostelijke curve
      [42.2977, 3.2739],  // Middellandse Zee
      [42.5000, 2.8000],  // Noordelijke curve terug
      [42.6982, 2.3291],  // Natuurlijke bocht
      [42.8500, 1.5000],  // Centrale noordzijde
      [43.0541, 0.7426],  // Noordelijke uitloper
      [43.2000, 0.0000],  // Zachte curve terug
      [43.3619, -1.7798]  // Terug naar start
    ]]
  },
  {
    id: 'region3',
    type: 'region',
    name: 'Ruhrgebied',
    alternativeNames: ['ruhrgebied', 'ruhr area', 'ruhr'],
    coordinates: [[
      [51.6500, 6.7000], // Noordwestelijk punt
      [51.6200, 6.9000], // Noordelijke curve
      [51.5800, 7.1000], // Noordoostelijke curve
      [51.5200, 7.3000], // Oostelijk punt
      [51.4500, 7.4500], // Zuidoostelijke curve
      [51.3800, 7.4000], // Zuidelijk punt
      [51.3200, 7.2000], // Zuidwestelijke curve
      [51.3000, 7.0000], // Westelijk punt
      [51.3500, 6.8000], // Noordwestelijke curve
      [51.4500, 6.7000], // Zachte curve noordwest
      [51.5500, 6.6500], // Noordwestelijke punt
      [51.6500, 6.7000]  // Terug naar start
    ]]
  }
]

// Custom markers voor verschillende statussen
const createCustomIcon = (status?: 'correct' | 'incorrect' | null) => {
  let color = '#3388ff'; // standaard blauw
  if (status === 'correct') color = '#4CAF50'; // groen
  if (status === 'incorrect') color = '#f44336'; // rood

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
        <path 
          d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
          fill="${color}"
          filter="url(#shadow)"
        />
        <circle 
          cx="16" 
          cy="16" 
          r="6" 
          fill="rgba(255,255,255,0.8)"
        />
      </svg>
    `)}`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
};

const initialLocations = [...CITIES, ...RIVERS, ...REGIONS]

const createConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#ff0000', '#ffa500']
  });
  
  fire(0.2, {
    spread: 60,
    colors: ['#00ff00', '#0000ff']
  });
  
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#ffff00', '#ff00ff']
  });
  
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#ff0000', '#00ff00', '#0000ff']
  });
  
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#ff0000', '#00ff00', '#0000ff']
  });
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng)
    },
  })
  return null
}

const CrossSVG = () => (
  <svg
    viewBox="0 0 100 100"
    style={{
      width: '80vmin',
      height: '80vmin',
      filter: 'url(#roughen)',
      opacity: 0,
      animation: 'fadeIn 0.3s ease-out forwards'
    }}
  >
    <defs>
      <filter id="roughen">
        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
      </filter>
    </defs>
    <path
      d="M20,20 L80,80 M80,20 L20,80"
      stroke="#ff0000"
      strokeWidth="10"
      strokeLinecap="round"
      strokeDasharray="200"
      strokeDashoffset="200"
      fill="none"
      style={{
        animation: 'drawStroke 0.5s ease-out forwards'
      }}
    />
  </svg>
)

// Voeg een style element toe voor de globale animaties
const GlobalStyles = () => (
  <style>
    {`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes drawStroke {
        to { stroke-dashoffset: 0; }
      }
    `}
  </style>
)

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('cities')
  const [locations, setLocations] = useState<(City | River | Region)[]>(initialLocations)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [guess, setGuess] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<(City | River | Region) | null>(null)
  const [showError, setShowError] = useState(false)
  const [categoryClicked, setCategoryClicked] = useState(false)
  
  // Nieuwe state voor overhoring
  const [isExamMode, setIsExamMode] = useState(false)
  const [examQuestions, setExamQuestions] = useState<(City | River | Region)[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [examResults, setExamResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [showExamComplete, setShowExamComplete] = useState(false)

  // Marker click handler
  const handleMarkerClick = (location: City | River | Region) => {
    if (!location.guessed) {
      setSelectedLocation(location)
      setDialogOpen(true)
      setGuess('')
    }
  }

  // Reset functie
  const handleReset = () => {
    setLocations(initialLocations)
    setDialogOpen(false)
    setGuess('')
    setShowError(false)
    setSelectedLocation(null)
    setIsExamMode(false)
    setCurrentQuestionIndex(0)
    setExamResults({ correct: 0, total: 0 })
    setCategoryClicked(false)
    setSelectedCategory('cities')
  }

  // Functie om een willekeurige selectie van items te maken
  const getRandomItems = (items: (City | River | Region)[], count: number) => {
    const shuffled = [...items].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // Start de overhoring
  const startExam = () => {
    const allItems = [...CITIES, ...RIVERS, ...REGIONS]
    const shuffledItems = [...allItems].sort(() => 0.5 - Math.random())
    setExamQuestions(shuffledItems)
    setCurrentQuestionIndex(0)
    setExamResults({ correct: 0, total: 0 })
    setIsExamMode(true)
    setShowExamComplete(false)
    
    // Reset alle locaties en toon alleen de huidige vraag
    setLocations([shuffledItems[0]])
    setSelectedLocation(shuffledItems[0])
    setDialogOpen(true)
  }

  // Handle antwoord in overhoring modus
  const handleExamGuess = useCallback(() => {
    if (!examQuestions[currentQuestionIndex]) return

    const normalizedGuess = guess.toLowerCase().trim()
    const isCorrect = examQuestions[currentQuestionIndex].alternativeNames.includes(normalizedGuess)

    if (isCorrect) {
      createConfetti()
      setExamResults(prev => ({ ...prev, correct: prev.correct + 1 }))
    }

    setExamResults(prev => ({ ...prev, total: prev.total + 1 }))

    // Ga naar de volgende vraag of eindig de overhoring
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setLocations([examQuestions[currentQuestionIndex + 1]].map(loc => ({ ...loc, guessed: false, status: null })))
      setGuess('')
    } else {
      // Overhoring is klaar
      setIsExamMode(false)
      setShowExamComplete(true)
      
      // Als meer dan 60% goed is, vier feest!
      const percentage = ((examResults.correct + (isCorrect ? 1 : 0)) / examQuestions.length) * 100
      if (percentage >= 60) {
        // Extra groot feest!
        setTimeout(() => {
          createConfetti()
          setTimeout(createConfetti, 500)
          setTimeout(createConfetti, 1000)
        }, 500)
      }
    }
  }, [currentQuestionIndex, examQuestions, guess])

  // Gebruik de juiste guess handler op basis van mode
  const handleGuess = useCallback(() => {
    if (isExamMode) {
      handleExamGuess()
    } else {
      // Bestaande handleGuess logica
      if (selectedLocation && guess.trim()) {
        const normalizedGuess = guess.toLowerCase().trim()
        const isCorrect = selectedLocation.alternativeNames.includes(normalizedGuess)

        if (isCorrect) {
          createConfetti()
          setLocations(locations.map(loc => 
            loc.id === selectedLocation.id 
              ? { ...loc, guessed: true, status: 'correct' } 
              : loc
          ))
          setDialogOpen(false)
          setGuess('')
        } else {
          setDialogOpen(false)
          setGuess('')
          setLocations(locations.map(loc => 
            loc.id === selectedLocation.id 
              ? { ...loc, status: 'incorrect' } 
              : loc
          ))
          setShowError(true)
          setTimeout(() => {
            setShowError(false)
          }, 1500)
        }
      }
    }
  }, [isExamMode, handleExamGuess, selectedLocation, guess, locations])

  const handleCategoryChange = (category: CategoryType) => {
    setSelectedCategory(category)
    setCategoryClicked(true)
    switch (category) {
      case 'cities':
        setLocations(CITIES.map(city => ({ ...city, guessed: false, status: null })))
        break
      case 'rivers':
        setLocations(RIVERS.map(river => ({ ...river, guessed: false, status: null })))
        break
      case 'regions':
        setLocations(REGIONS.map(region => ({ ...region, guessed: false, status: null })))
        break
    }
  }

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <GlobalStyles />
      
      {/* Reset knop */}
      <Button
        variant="contained"
        startIcon={<DeleteIcon />}
        onClick={handleReset}
        sx={{
          position: 'absolute',
          bottom: { xs: 10, sm: 20 },
          left: { xs: 10, sm: 20 },
          zIndex: 1000,
          backgroundColor: '#ff5252',
          '&:hover': {
            backgroundColor: '#ff1744',
          },
          fontFamily: '"Comic Sans MS", cursive, sans-serif',
          borderRadius: 3,
          padding: { xs: '8px 16px', sm: '10px 20px' },
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          fontSize: { xs: '0.9rem', sm: '1rem' }
        }}
      >
        Begin Opnieuw! 🔄
      </Button>

      {/* Score teller */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: { xs: 10, sm: 20 },
          right: { xs: 10, sm: 20 },
          zIndex: 1000,
          padding: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          width: { xs: '90%', sm: 250, md: 250 },
          maxWidth: '95vw',
          borderRadius: 4,
          border: '3px solid #4CAF50',
          height: 'auto',
          minHeight: { xs: 150, sm: 180 },
          marginBottom: 2,
          '@media (max-width: 768px)': {
            right: '50%',
            transform: 'translateX(50%)'
          }
        }}
      >
        <Typography 
          variant="h5" 
          align="center" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: '#2196F3',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }}
        >
          🎯 Jouw Score! 🎯
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          backgroundColor: '#E8F5E9',
          padding: 1,
          borderRadius: 2,
          border: '2px solid #81C784'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#4CAF50',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              {locations.filter(loc => loc.status === 'correct').length}
            </Typography>
            <Typography sx={{ 
              fontSize: '16px',
              color: '#4CAF50',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              🌟 Goed! 🌟
            </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          backgroundColor: '#FFEBEE',
          padding: 1,
          borderRadius: 2,
          border: '2px solid #E57373'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f44336',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              {locations.filter(loc => loc.status === 'incorrect').length}
            </Typography>
            <Typography sx={{ 
              fontSize: '16px',
              color: '#f44336',
              fontFamily: '"Comic Sans MS", cursive, sans-serif'
            }}>
              😮 Oeps! 😮
            </Typography>
          </Box>
        </Box>

        {/* Motiverende boodschap */}
        <Typography 
          align="center" 
          sx={{ 
            fontSize: '14px',
            color: '#666',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            marginTop: 1
          }}
        >
          {locations.filter(loc => loc.status === 'correct').length === 0 ? "Je kunt het! 💪" :
           locations.filter(loc => loc.status === 'correct').length < 5 ? "Goed bezig! 🎈" :
           locations.filter(loc => loc.status === 'correct').length < 10 ? "Super goed! 🌟" :
           "Geweldig gedaan! 🏆"}
        </Typography>
      </Paper>

      {/* Categorieën Menu */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: { xs: 200, sm: 320 },
          right: { xs: 10, sm: 20 },
          zIndex: 1000,
          padding: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          width: { xs: '90%', sm: 250, md: 250 },
          maxWidth: '95vw',
          borderRadius: 4,
          border: '3px solid #2196F3',
          height: 'auto',
          minHeight: { xs: 250, sm: 280 },
          marginBottom: 2,
          '@media (max-width: 768px)': {
            right: '50%',
            transform: 'translateX(50%)'
          }
        }}
      >
        <Typography 
          variant="h5" 
          align="center" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: '#2196F3',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }}
        >
          🗺️ Categorieën 🗺️
        </Typography>

        <Button
          variant="contained"
          onClick={() => handleCategoryChange('cities')}
          sx={{
            backgroundColor: selectedCategory === 'cities' ? '#45a049' : '#4CAF50',
            '&:hover': { backgroundColor: '#45a049' },
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1.1rem',
            padding: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          🏙️ Steden
        </Button>

        <Button
          variant="contained"
          onClick={() => handleCategoryChange('rivers')}
          sx={{
            backgroundColor: selectedCategory === 'rivers' ? '#1976D2' : '#2196F3',
            '&:hover': { backgroundColor: '#1976D2' },
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1.1rem',
            padding: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          💧 Rivieren
        </Button>

        <Button
          variant="contained"
          onClick={() => handleCategoryChange('regions')}
          sx={{
            backgroundColor: selectedCategory === 'regions' ? '#7B1FA2' : '#9C27B0',
            '&:hover': { backgroundColor: '#7B1FA2' },
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1.1rem',
            padding: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          ⛰️ Gebieden/Gebergten
        </Button>

        <Typography 
          align="center" 
          sx={{ 
            fontSize: '14px',
            color: '#666',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            marginTop: 1,
            fontStyle: 'italic'
          }}
        >
          Kies een categorie om te oefenen! ✨
        </Typography>

        <Typography 
          align="center" 
          sx={{ 
            fontSize: '14px',
            color: '#FF5722',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            marginTop: 1,
            padding: '8px',
            backgroundColor: '#FFF3E0',
            borderRadius: '8px',
            border: '2px dashed #FF5722'
          }}
        >
          Let op! Als je op een knop klikt, verdwijnen alle namen. 
          Dan moet je zelf de juiste namen invullen door op de markers te klikken! 🎯
        </Typography>
      </Paper>

      {/* Overhoring Box */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: { xs: 480, sm: 850 },
          right: { xs: 10, sm: 20 },
          zIndex: 1000,
          padding: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          width: { xs: '90%', sm: 250, md: 250 },
          maxWidth: '95vw',
          borderRadius: 4,
          border: '3px solid #FF9800',
          height: 'auto',
          minHeight: { xs: 140, sm: 160 },
          '@media (max-width: 768px)': {
            right: '50%',
            transform: 'translateX(50%)'
          }
        }}
      >
        <Typography 
          variant="h5" 
          align="center" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: '#FF9800',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }}
        >
          📝 Overhoring 📝
        </Typography>

        <Button
          variant="contained"
          onClick={startExam}
          sx={{
            backgroundColor: '#FF9800',
            '&:hover': { backgroundColor: '#F57C00' },
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1.1rem',
            padding: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          🎯 Start Overhoring
        </Button>

        <Typography 
          align="center" 
          sx={{ 
            fontSize: '14px',
            color: '#666',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            marginTop: 1,
            fontStyle: 'italic'
          }}
        >
          Test je kennis! 🌟
        </Typography>
      </Paper>

      <MapContainer
        center={[48.5, 7.0]} // Meer centraal in Europa
        zoom={6} // Dichterbij ingezoomd
        style={{ width: '100%', height: '100%' }}
        preferCanvas={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {locations.map((location) => {
          if (location.type === 'city') {
            return (
              <Marker
                key={location.id}
                position={location.position}
                icon={createCustomIcon(location.status)}
                eventHandlers={{
                  click: () => handleMarkerClick(location),
                }}
              >
                {location.guessed && <Popup>{location.name}</Popup>}
                {location.type === 'city' && !location.guessed && !categoryClicked && (
                  <Tooltip permanent direction={location.name === 'Keulen' ? 'left' : 'top'} offset={location.name === 'Keulen' ? [-10, -20] : [0, -20]}>
                    <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                      <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
                        {location.name}
                      </Typography>
                    </Paper>
                  </Tooltip>
                )}
              </Marker>
            )
          } else if (location.type === 'river') {
            // Speciale weergave voor Het Kanaal en Middellandse Zee
            if (location.name === 'Het Kanaal' || location.name === 'Middellandse Zee') {
              const center = location.name === 'Het Kanaal' 
                ? [50.5000, -2.0000] as [number, number] // Verplaatst naar het midden van Het Kanaal
                : [41.5000, 7.0000] as [number, number]; // Centrum voor Middellandse Zee
              
              return (
                <Marker
                  key={location.id}
                  position={center}
                  eventHandlers={{
                    click: () => handleMarkerClick(location),
                  }}
                  icon={new Icon({
                    iconUrl: `data:image/svg+xml;base64,${btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                          </filter>
                        </defs>
                        <path 
                          d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                          fill="${location.status === 'correct' ? '#4CAF50' : 
                                location.status === 'incorrect' ? '#f44336' : 
                                '#3388ff'}"
                          filter="url(#shadow)"
                        />
                        <circle 
                          cx="16" 
                          cy="16" 
                          r="12"
                          fill="rgba(255,255,255,0.9)"
                        />
                        <text 
                          x="16" 
                          y="22" 
                          text-anchor="middle" 
                          font-size="16" 
                          font-weight="bold" 
                          fill="#1976D2"
                          font-family="Arial, sans-serif"
                        >${location.name === 'Het Kanaal' ? '1' : '2'}</text>
                      </svg>
                    `)}`,
                    iconSize: [32, 44],
                    iconAnchor: [16, 44],
                    popupAnchor: [0, -44],
                  })}
                >
                  {location.guessed && <Popup>{location.name}</Popup>}
                  {!location.guessed && !categoryClicked && (
                    <Tooltip permanent direction="top" offset={[0, -20]}>
                      <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                          {location.name}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  )}
                </Marker>
              )
            }
            // Normale rivieren als lijnen
            if (location.name === 'Seine') {
              const center: [number, number] = [49.4431, 0.1903]; // Terug naar Le Havre (begin van de Seine)
              return (
                <>
                  <Polyline
                    key={location.id}
                    positions={location.coordinates}
                    pathOptions={{
                      color: location.status === 'correct' ? '#4CAF50' : 
                             location.status === 'incorrect' ? '#f44336' : 
                             '#2196F3',
                      weight: 4,
                      opacity: 0.8,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                  />
                  <Marker
                    position={center}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                          <defs>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                            </filter>
                          </defs>
                          <path 
                            d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                            fill="${location.status === 'correct' ? '#4CAF50' : 
                                  location.status === 'incorrect' ? '#f44336' : 
                                  '#3388ff'}"
                            filter="url(#shadow)"
                          />
                          <circle 
                            cx="16" 
                            cy="16" 
                            r="12"
                            fill="rgba(255,255,255,0.9)"
                          />
                          <text 
                            x="16" 
                            y="22" 
                            text-anchor="middle" 
                            font-size="16" 
                            font-weight="bold" 
                            fill="#1976D2"
                            font-family="Arial, sans-serif"
                          >3</text>
                        </svg>
                      `)}`,
                      iconSize: [32, 44],
                      iconAnchor: [16, 44],
                      popupAnchor: [0, -44],
                    })}
                  >
                    {location.guessed && <Popup>{location.name}</Popup>}
                    {!location.guessed && !categoryClicked && (
                      <Tooltip permanent direction="top" offset={[0, -20]}>
                        <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                            {location.name}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Marker>
                </>
              )
            }
            if (location.name === 'Rhône') {
              const center: [number, number] = [44.9389, 4.8924]; // Positie voor cijfer 4 bij Valence
              return (
                <>
                  <Polyline
                    key={location.id}
                    positions={location.coordinates}
                    pathOptions={{
                      color: location.status === 'correct' ? '#4CAF50' : 
                             location.status === 'incorrect' ? '#f44336' : 
                             '#2196F3',
                      weight: 4,
                      opacity: 0.8,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                  />
                  <Marker
                    position={center}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                          <defs>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                            </filter>
                          </defs>
                          <path 
                            d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                            fill="${location.status === 'correct' ? '#4CAF50' : 
                                  location.status === 'incorrect' ? '#f44336' : 
                                  '#3388ff'}"
                            filter="url(#shadow)"
                          />
                          <circle 
                            cx="16" 
                            cy="16" 
                            r="12"
                            fill="rgba(255,255,255,0.9)"
                          />
                          <text 
                            x="16" 
                            y="22" 
                            text-anchor="middle" 
                            font-size="16" 
                            font-weight="bold" 
                            fill="#1976D2"
                            font-family="Arial, sans-serif"
                          >4</text>
                        </svg>
                      `)}`,
                      iconSize: [32, 44],
                      iconAnchor: [16, 44],
                      popupAnchor: [0, -44],
                    })}
                  >
                    {location.guessed && <Popup>{location.name}</Popup>}
                    {!location.guessed && !categoryClicked && (
                      <Tooltip permanent direction="top" offset={[0, -20]}>
                        <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                            {location.name}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Marker>
                </>
              )
            }
            if (location.name === 'Donau') {
              const center: [number, number] = [47.4979, 19.0402]; // Positie voor cijfer 5 bij Budapest
              return (
                <>
                  <Polyline
                    key={location.id}
                    positions={location.coordinates}
                    pathOptions={{
                      color: location.status === 'correct' ? '#4CAF50' : 
                             location.status === 'incorrect' ? '#f44336' : 
                             '#2196F3',
                      weight: 4,
                      opacity: 0.8,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                  />
                  <Marker
                    position={center}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                          <defs>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                            </filter>
                          </defs>
                          <path 
                            d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                            fill="${location.status === 'correct' ? '#4CAF50' : 
                                  location.status === 'incorrect' ? '#f44336' : 
                                  '#3388ff'}"
                            filter="url(#shadow)"
                          />
                          <circle 
                            cx="16" 
                            cy="16" 
                            r="12"
                            fill="rgba(255,255,255,0.9)"
                          />
                          <text 
                            x="16" 
                            y="22" 
                            text-anchor="middle" 
                            font-size="16" 
                            font-weight="bold" 
                            fill="#1976D2"
                            font-family="Arial, sans-serif"
                          >5</text>
                        </svg>
                      `)}`,
                      iconSize: [32, 44],
                      iconAnchor: [16, 44],
                      popupAnchor: [0, -44],
                    })}
                  >
                    {location.guessed && <Popup>{location.name}</Popup>}
                    {!location.guessed && !categoryClicked && (
                      <Tooltip permanent direction="top" offset={[0, -20]}>
                        <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                            {location.name}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Marker>
                </>
              )
            }
            if (location.name === 'Rijn') {
              const center: [number, number] = [49.5783, 8.4037]; // Verplaatst naar Mannheim
              return (
                <>
                  <Polyline
                    key={location.id}
                    positions={location.coordinates}
                    pathOptions={{
                      color: location.status === 'correct' ? '#4CAF50' : 
                             location.status === 'incorrect' ? '#f44336' : 
                             '#2196F3',
                      weight: 4,
                      opacity: 0.8,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                  />
                  <Marker
                    position={center}
                    eventHandlers={{
                      click: () => handleMarkerClick(location),
                    }}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                          <defs>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                              <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                              <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                              <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                            </filter>
                          </defs>
                          <path 
                            d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                            fill="${location.status === 'correct' ? '#4CAF50' : 
                                  location.status === 'incorrect' ? '#f44336' : 
                                  '#3388ff'}"
                            filter="url(#shadow)"
                          />
                          <circle 
                            cx="16" 
                            cy="16" 
                            r="12"
                            fill="rgba(255,255,255,0.9)"
                          />
                          <text 
                            x="16" 
                            y="22" 
                            text-anchor="middle" 
                            font-size="16" 
                            font-weight="bold" 
                            fill="#1976D2"
                            font-family="Arial, sans-serif"
                          >6</text>
                        </svg>
                      `)}`,
                      iconSize: [32, 44],
                      iconAnchor: [16, 44],
                      popupAnchor: [0, -44],
                    })}
                  >
                    {location.guessed && <Popup>{location.name}</Popup>}
                    {!location.guessed && !categoryClicked && (
                      <Tooltip permanent direction="top" offset={[0, -20]}>
                        <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                            {location.name}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Marker>
                </>
              )
            }
            return (
              <Polyline
                key={location.id}
                positions={location.coordinates}
                pathOptions={{
                  color: location.status === 'correct' ? '#4CAF50' : 
                         location.status === 'incorrect' ? '#f44336' : 
                         '#2196F3',
                  weight: 4,
                  opacity: 0.8,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(location),
                }}
              />
            )
          } else if (location.type === 'region') {
            // Bepaal het centrum voor elke regio
            const center = location.name === 'Alpen' 
              ? [46.8000, 10.0000] as [number, number]  // Centrum voor Alpen
              : location.name === 'Pyreneeën'
              ? [42.7000, 0.5000] as [number, number]   // Centrum voor Pyreneeën
              : [51.6500, 6.7000] as [number, number];  // Verplaatst naar noordwestelijk punt Ruhrgebied

            const letter = location.name === 'Alpen' ? 'A' 
                        : location.name === 'Pyreneeën' ? 'B' 
                        : 'C';
            
            return (
              <>
                <Polygon
                  key={location.id}
                  positions={location.coordinates}
                  pathOptions={{
                    fillColor: '#8B4513',
                    fillOpacity: 0.25,
                    color: '#8B4513',
                    weight: 1
                  }}
                  eventHandlers={{
                    click: () => handleMarkerClick(location),
                  }}
                />
                <Marker
                  position={center}
                  eventHandlers={{
                    click: () => handleMarkerClick(location),
                  }}
                  icon={new Icon({
                    iconUrl: `data:image/svg+xml;base64,${btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feOffset result="offOut" in="SourceGraphic" dx="0" dy="1" />
                            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                          </filter>
                        </defs>
                        <path 
                          d="M16 0C7.16 0 0 7.16 0 16c0 9.7 16 28 16 28s16-18.3 16-28c0-8.84-7.16-16-16-16z"
                          fill="${location.status === 'correct' ? '#4CAF50' : 
                                location.status === 'incorrect' ? '#f44336' : 
                                '#3388ff'}"
                          filter="url(#shadow)"
                        />
                        <circle 
                          cx="16" 
                          cy="16" 
                          r="12"
                          fill="rgba(255,255,255,0.9)"
                        />
                        <text 
                          x="16" 
                          y="22" 
                          text-anchor="middle" 
                          font-size="16" 
                          font-weight="bold" 
                          fill="#1976D2"
                          font-family="Arial, sans-serif"
                        >${letter}</text>
                      </svg>
                    `)}`,
                    iconSize: [32, 44],
                    iconAnchor: [16, 44],
                    popupAnchor: [0, -44],
                  })}
                >
                  {location.guessed && <Popup>{location.name}</Popup>}
                  {!location.guessed && !categoryClicked && (
                    <Tooltip permanent direction="top" offset={[0, -20]}>
                      <Paper sx={{ padding: '5px 10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <Typography sx={{ fontFamily: '"Comic Sans MS", cursive, sans-serif', color: '#9C27B0' }}>
                          {location.name}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  )}
                </Marker>
              </>
            )
          }
        })}
      </MapContainer>

      {showError && (
        <CrossSVG />
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          if (!isExamMode) {
            setDialogOpen(false)
            setGuess('')
            setShowError(false)
          }
        }}
        TransitionProps={{
          onEntered: () => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (input) {
              input.focus();
            }
          }
        }}
        PaperProps={{
          sx: {
            position: 'fixed',
            left: { xs: '50%', sm: '20px' },
            top: '50%',
            transform: { xs: 'translate(-50%, -50%)', sm: 'translateY(-50%)' },
            m: 0,
            width: { xs: '90%', sm: 300 },
            maxWidth: '95vw',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          {isExamMode 
            ? `Vraag ${currentQuestionIndex + 1} van ${examQuestions.length}` 
            : "Wat is dit op de kaart?"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={isExamMode ? "Jouw antwoord" : "Naam van de locatie"}
            fullWidth
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && guess.trim()) {
                e.preventDefault()
                handleGuess()
              }
            }}
            InputProps={{
              autoFocus: true,
              autoComplete: "off"
            }}
            sx={{
              '& .MuiInputBase-input': {
                '&:focus': {
                  outline: 'none'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            if (isExamMode) {
              // Bij overslaan in exam mode, ga naar volgende vraag
              if (currentQuestionIndex < examQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1)
                setLocations([examQuestions[currentQuestionIndex + 1]].map(loc => ({ ...loc, guessed: false, status: null })))
                setGuess('')
                setExamResults(prev => ({ ...prev, total: prev.total + 1 }))
              } else {
                setIsExamMode(false)
                setShowExamComplete(true)
              }
            } else {
              setDialogOpen(false)
              setGuess('')
              setShowError(false)
            }
          }}>
            {isExamMode ? "Overslaan" : "Annuleren"}
          </Button>
          <Button 
            onClick={handleGuess} 
            variant="contained"
            disabled={!guess.trim()}
          >
            Controleer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overhoring resultaat dialog */}
      <Dialog 
        open={showExamComplete} 
        onClose={() => {
          setShowExamComplete(false)
          handleReset()
        }}
      >
        <DialogTitle>
          {examResults.correct / examQuestions.length >= 0.6 
            ? "🎉 Gefeliciteerd! 🎉" 
            : "Helaas!"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" align="center" gutterBottom>
            Je hebt {examResults.correct} van de {examQuestions.length} vragen goed beantwoord!
          </Typography>
          <Typography variant="body1" align="center" color={examResults.correct / examQuestions.length >= 0.6 ? "success.main" : "error.main"}>
            {examResults.correct / examQuestions.length >= 0.6 
              ? "Je hebt een voldoende gehaald! 🌟" 
              : "Blijf oefenen, je kunt het! 💪"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowExamComplete(false)
            handleReset()
          }}>
            Terug naar oefenen
          </Button>
          <Button 
            onClick={startExam}
            variant="contained"
            color="primary"
          >
            Nog een keer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 