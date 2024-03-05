import url from 'url';
import axios from 'axios';
import { appLogger } from '../logger.js';

export default class CMS12 {
  constructor(baseURL, clientId, clientSecret, orgId) {
    this.baseURL = baseURL;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.orgId = orgId;
  }

  async initialize() {
    this.token = await this.generateToken();
  }

  async generateToken() {
    const tokenAPIResponse = await axios.post(
      `${this.baseURL}/api/episerver/connect/token`,
      new url.URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'epi_content_definitions epi_content_management'
      }).toString(),
      {headers: {'content-type': 'application/x-www-form-urlencoded'}}
    );
    appLogger.info({
      data: tokenAPIResponse.data
    }, 'generated token data');
    return {
      value: tokenAPIResponse.data.access_token,
      type: tokenAPIResponse.data.token_type
    };
  }

  async createContent(data) {
    const createContentResponse = await axios.post(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement`,
      data,
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json',
          'x-epi-validation-mode': 'minimal'
        }
      }
    );
    appLogger.info({
      data: createContentResponse.data
    });
    return createContentResponse.data.contentLink;
  }

  async getContent(contentGuid) {
    const createContentResponse = await axios.get(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement/${contentGuid}`,
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        }
      }
    );
    appLogger.info({
      data: createContentResponse.data
    });
    return createContentResponse.data;
  }

  async amendContent(contentId, data) {
    const amendContentReponse = await axios.put(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement/${contentId}`,
      data,
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
        }
      }
    );
    appLogger.info({
      data: amendContentReponse.data
    });
    return amendContentReponse.data.url;
  }

  async createAssetContent(assetUrl, title, mimeType) {
    const createContentResponse = await axios.post(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement/damidentities`,
      {assetUrl, title, mimeType},
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json',
          'x-epi-validation-mode': 'minimal'
        }
      }
    );
    appLogger.info({
      data: createContentResponse.data
    }, 'created asset container');
    return createContentResponse.data.contentLink;
  }

  async deleteContent(guid) {
    const deleteResponse = await axios.delete(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement/${guid}`,
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
        }
      }
    );
    appLogger.info({
      data: deleteResponse.data
    });
  }
};
