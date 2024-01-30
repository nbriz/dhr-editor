'use strict';

/**
 * governance service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::governance.governance');
