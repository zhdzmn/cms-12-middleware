import url from 'url';
import axios from 'axios';

export default class CMS12 {
  constructor(baseURL, clientId, clientSecret, orgId) {
    this.baseURL = baseURL;
    this.apiURL = `${baseURL}/_cms/preview1`;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.orgId = orgId;
  }

  async initialize() {
    this.token = await this.generateToken();
  }

  getAuthHeader() {
    return {
      'Authorization': `${this.token.type} ${this.token.value}`,
    };
  }

  async doGet(relativeURL, additionalHeader = {}) {
    const getResponse = await axios.get(
      `${this.baseURL}/${relativeURL}`,
      {
        headers: {
          ...this.getAuthHeader(),
          ...additionalHeader,
          'Content-Type': 'application/json',
        }
      }
    );
    return getResponse.data;
  }

  async generateToken() {
    const tokenAPIResponse = await axios.post(
      `${this.apiURL}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      },
      {headers: {'content-type': 'application/json'}}
    );
    return {
      value: tokenAPIResponse.data.access_token,
      type: tokenAPIResponse.data.token_type
    };
  }

  async createContent(data) {
    const createContentResponse = await axios.post(
      `${this.apiURL}/content?skipValidation=true`,
      data,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json',
          'x-epi-validation-mode': 'minimal'
        }
      }
    );

    const content = createContentResponse.data;
    const { url } = await this.doGet(
      `api/orchestrate/content/${content.key}/${content.version}/language/${content.locale}/endpoints`
    );
    const contentURL = new URL(url);
    contentURL.host = 'int.optimizely.com';
    content.url = contentURL.href;
    return content;
  }

  async getContent(contentGuid) {
    const response = await this.doGet(
      `content/${contentGuid}`,
      { 'Accept-Language': 'en' }
    );
    return response;
  }

  async patchContent(contentId, data) {
    const response = await axios.patch(
      `${this.apiURL}/content/${contentId}`,
      data,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async createAssetContainer(asset, assetType) {
    const response = await axios.post(
      `${this.baseURL}/cmpdam/getorcreatedamasset`,
      {
        externalUrl: asset.url,
        title: asset.title,
        assetType,
        altText: asset.alt,
        width: asset.width,
        height: asset.height,
        assetGuid: asset.guid
      },
      {
        headers: {
          'Authorization': `${this.token.type} ${this.token.value}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return `cms://content/${response.data.guid.split('-').join('')}`;
  }

  async deleteContent(guid) {
    const response = await axios.delete(
      `${this.apiURL}/content/${guid}`,
      {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
};
