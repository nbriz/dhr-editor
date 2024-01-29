'use strict';

/**
 * preamble service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::preamble.preamble');
