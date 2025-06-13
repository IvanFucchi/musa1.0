import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createSpot,
  getSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
  approveSpot,
  getNearbySpots,
  discoverSpots
} from '../controllers/spotController.js';

const router = express.Router();

// Rotte pubbliche
router.get('/', getSpots);
router.get('/nearby', getNearbySpots);
router.get('/discover', discoverSpots);
router.get('/:id', getSpotById);

// Rotte protette
router.post('/', protect, createSpot);
router.route('/:id')
  .put(protect, updateSpot)
  .delete(protect, deleteSpot);

// Rotte admin
router.put('/:id/approve', protect, admin, approveSpot);

export default router;
