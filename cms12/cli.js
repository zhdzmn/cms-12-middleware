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
          'authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
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
          'authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
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
          'authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
        }
      }
    );
    appLogger.info({
      data: amendContentReponse.data
    });
    return amendContentReponse.data.url;
  }
  async deleteContent(guid) {
    const deleteResponse = await axios.delete(
      `${this.baseURL}/api/episerver/v3.0/contentmanagement/${guid}`,
      {
        headers: {
          'authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
        }
      }
    );
    appLogger.info({
      data: deleteResponse.data
    });
  }
};
