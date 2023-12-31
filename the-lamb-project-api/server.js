const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { NotFoundError } = require('./utils/errors');
const { PORT } = require('./config');
const authRoutes = require('./routes/auth');
const userPreferenceRoutes = require('./routes/user_preference');
const security = require('./middleware/security.js');
const axios = require('axios');
const weatherRoute = require('./routes/weatherRoute');
const walkscoreRoute = require('./routes/walkscoreRoute');
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.use(security.extractUserFromJwt);

app.use('/auth', authRoutes);
app.use('/user', userPreferenceRoutes);
app.use('/api', weatherRoute);
app.use('/getwalkscore', walkscoreRoute);

// Add the new route handler here
app.get('/api/city/:cityName/scores', async (req, res, next) => {
  const cityName = req.params.cityName;

  try {
    // Convert the city name to lowercase and replace spaces with hyphens
    const formattedCityName = cityName.replace(/\s+/g, '-').toLowerCase();
    const response = await axios.get(`https://api.teleport.org/api/urban_areas/slug:${formattedCityName}/scores/`);
    const scores = response.data;
    res.json(scores);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return next(new NotFoundError('City scores not found on Teleport API.'));
    }
    console.error('Error fetching scores:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((req, res, next) => {
  console.log("404: Route not found.");
  return next(new NotFoundError());
});

app.use((req, res, next) => {
  return next(new NotFoundError());
});

app.use(function (req, res, next) {
  return next(new NotFoundError());
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({
    error: { message, status },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on https://the-lamb-project-api.onrender.com/${PORT}`);
});
