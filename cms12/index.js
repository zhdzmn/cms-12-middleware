import { v4 as uuidv4 } from 'uuid';
import { appLogger } from '../logger.js';
import { getToken, postPublicAPI } from '../cmp.js';
import { prepareCMSData } from './tokenMapper.js';
import Accessify from '../accessify/index.js';
import CMS12 from './cli.js';

function _getConfigFromENV() {
  return {
    CMS_URL: process.env.CMS_URL,
    CMS12_CLIENT_ID: process.env.CMS12_CLIENT_ID,
    CMS12_CLIENT_SECRET: process.env.CMS12_CLIENT_SECRET,
    APP_CLIENT_ID: process.env.APP_CLIENT_ID,
    APP_CLIENT_SECRET: process.env.APP_CLIENT_SECRET,
  };
}

export async function publish(req, res) {
  const payload = req.body;
  const structuredContent = payload.data.assets.structured_contents[0];
  const contentTypeName = structuredContent.content_body.content_type.name;
  const orgId = payload.data.organization.id;
  const accessify = new Accessify(orgId);
  const contentTypeMapping = await accessify.getContentTypeMapping();
  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting publishing for non supported content type');
    return res.status(200).json({message: 'not publishing since the contentType did not match'});
  }
  const contentType = contentTypeMapping[contentTypeName];
  // get config data from accessify
  const configFromAccessify = await accessify.getConfig();
  const config = {
    ..._getConfigFromENV(),
    ...configFromAccessify
  };
  // get app token for open api calls
  const token = await getToken(config.APP_CLIENT_ID, config.APP_CLIENT_SECRET);

  const fieldsWithLocal = structuredContent.content_body.latest_fields_version.fields;
  const structuredContentId = structuredContent.id;
  appLogger.info('publishing cms12');

  // prepare cms12 data
  const cmsData = await prepareCMSData(fieldsWithLocal, contentType.mapping, token);
  appLogger.debug({cmsData}, 'prepared cms data');
  cmsData.language = { 'name': 'en' };
  cmsData.contentType = [contentType.contentType];
  cmsData.status = 'Published';
  cmsData.parentLink = {id: contentType.parentFolder};
  cmsData.name = cmsData.name?.value || payload.data.assets?.structured_contents[0]?.content_body.title;

  // initialize cms12 cli
  const cms12 = new CMS12(
    config.CMS_URL,
    config.CMS12_CLIENT_ID,
    config.CMS12_CLIENT_SECRET,
    orgId,
  );
  appLogger.info({
    url: config.CMS_URL,
    clientId: config.CMS12_CLIENT_ID,
    secret: config.CMS12_CLIENT_SECRET,
    orgId
  }, 'cms12 cli initiated');

  await cms12.initialize();

  const { url, guidValue} = await cms12.createContent(cmsData);

  await postPublicAPI(token, payload.data.publishing_event.links.publishing_metadata, {
    data: [{
      status: 'published',
      status_message: 'Successfully published to CMS',
      publishing_destination_updated_at: (new Date()).toISOString(),
      public_url: url,
      asset_id: structuredContentId,
      locale: 'en'
    }],
  });

  appLogger.info('publishing completed');
  return res.status(200).json({success: true});
};

export async function generatePreview(req, res) {
  const payload = req.body;
  const fieldsWithLocal = payload.data.assets?.structured_contents[0]?.content_body.fields_version.fields;
  appLogger.info('Generating preview');
  const contentTypeName = payload.data.assets?.structured_contents[0].content_body.content_type.name;
  const orgId = payload.data.organization.id;
  appLogger.info(payload.data.assets?.structured_contents[0].content_body.content_type);
  const accessify = new Accessify(orgId);
  const contentTypeMapping = await accessify.getContentTypeMapping();
  if (!contentTypeMapping.hasOwnProperty(contentTypeName)) {
    appLogger.error({
      contentTypeName,
      availableTypes: Object.keys(contentTypeMapping)
    }, 'rejecting preview for non supported content type');
    return res.status(200).json({
      message: 'not generating the preview since the contentType did not match'
    });
  }
  const contentType = contentTypeMapping[contentTypeName];
  // get config data from accessify
  const configFromAccessify = await accessify.getConfig();
  const config = {
    ..._getConfigFromENV(),
    ...configFromAccessify
  };
  // get app token for open api calls
  const token = await getToken(config.APP_CLIENT_ID, config.APP_CLIENT_SECRET);
  const hash = payload.data.assets?.structured_contents[0]?.content_body.fields_version.content_hash;
  appLogger.info('generated Token');

  // acknowledge the preview request
  await postPublicAPI(token, payload.data.links.acknowledge, {
    acknowledged_by: "cms-12-middleware",
    content_hash: hash,
  });
  appLogger.info({url: payload.data.links.acknowledge}, 'preview acknowledged');

  // prepare cms12 data
  const cmsData = await prepareCMSData(fieldsWithLocal, contentType.mapping, token);
  appLogger.debug({cmsData}, 'prepared cms data');
  cmsData.language = { 'name': 'en' };
  cmsData.contentType = [contentType.contentType];
  cmsData.status = 'Published';
  cmsData.parentLink = {id: contentType.parentFolder};
  cmsData.name = cmsData.name?.value || payload.data.assets?.structured_contents[0]?.content_body.title;

  // initialize cms12 cli
  const cms12 = new CMS12(
    config.CMS_URL,
    config.CMS12_CLIENT_ID,
    config.CMS12_CLIENT_SECRET,
    orgId,
  );
  appLogger.info({
    url: config.CMS_URL,
    clientId: config.CMS12_CLIENT_ID,
    secret: config.CMS12_CLIENT_SECRET,
    orgId
  }, 'cms12 cli initiated');

  await cms12.initialize();

  const { url, guidValue} = await cms12.createContent(cmsData);

  // send complete api call to the openapi
  await postPublicAPI(token, payload.data.links.complete, {
    keyedPreviews: {
      [`cms12-page-${uuidv4()}`]: url
    },
  });

  // remove preview page
  setTimeout(async () => {
    cms12.deleteContent(guidValue).then(() => {
      appLogger.info('removed preview completed');
    }).catch(err => appLogger.error({err}, 'failed to remove the post'));
  }, 60000);

  appLogger.info('preview completed');
  return res.status(200).json({success: true});
};
