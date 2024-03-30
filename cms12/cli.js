import axios from 'axios';


export default class CMS12 {
  constructor(baseURL, clientId, clientSecret) {
    this.baseURL = baseURL;
    this.apiURL = `${baseURL}/_cms/preview1`;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async initialize() {
    this.token = await this.generateToken();
  }

  getAuthHeader() {
    return {
      'Authorization': `${this.token.type} ${this.token.value}`,
    };
  }

  async doGet(relativeURL, additionalHeader = {}, integrationAPI = true) {
    const getResponse = await axios.get(
      `${integrationAPI ? this.apiURL : this.baseURL}/${relativeURL}`,
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

  async doPost(relativeURL, data, additionalHeader = {}, integrationAPI = true) {
    const getResponse = await axios.post(
      `${integrationAPI ? this.apiURL : this.baseURL}/${relativeURL}`,
      data,
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

  async getContentURL(contentKey, versionId, locale) {
    const { url } = await this.doGet(
      `api/orchestrate/content/${contentKey}/${versionId}/language/${locale}/endpoints`,
      {},
      false
    );
    const contentURL = new URL(url);
    contentURL.host = new URL(process.env.CMS_URL).host;
    return contentURL.href;
  }

  async createContent(data) {
    const content = await this.doPost(
      'content?skipValidation=true',
      data
    );
    content.url = await this.getContentURL(content.key, content.version, content.locale);;
    return content;
  }

  getContent(contentGuid) {
    return this.doGet(
      `content/${contentGuid}`
    );
  }

  async createAssetContainer(asset, assetType) {
    const response = await this.doPost(
      `cmpdam/getorcreatedamasset`,
      {
        externalUrl: asset.url,
        title: asset.title,
        assetType,
        altText: asset.alt,
        width: asset.width,
        height: asset.height,
        assetGuid: asset.guid
      },
      {},
      false
    );
    return `cms://content/${response.guid.split('-').join('')}`;
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
