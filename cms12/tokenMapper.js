import { getAsset } from "../cmp.js";

function mergeTokenData(listResults) {
  let returnVal = {};
  listResults.filter(Boolean).forEach(result => {
    returnVal = {
      ...returnVal,
      ...result
    };
  });
  return returnVal;
}

export async function prepareCMSData(fieldValues, valueMapping, apiToken, cms12CLI) {
  if (!fieldValues) { return; }
  const results = await Promise.all(Object.entries(valueMapping).map(
    async ([attr, attrSchema]) => {
      if (attrSchema.behaviour === 'List') {
        const listResults = await Promise.all(attrSchema.elements.map((_attrSchema, index) => {
          return prepareCMSData(
            fieldValues,
            {[attr]: {..._attrSchema, _type: attrSchema._type, valIndex: index}},
            apiToken
          );
        }));
        return mergeTokenData(listResults);
      }
      const activeFieldValue = fieldValues[attr]?.[0].field_values?.[attrSchema.valIndex ?? 0];
      if (attrSchema._type === 'Component') {
        const listResults = await Promise.all(Object.entries(attrSchema.map).map(([_attr, _attrSchema]) => {
          return prepareCMSData(
            activeFieldValue?.content_details.latest_fields_version?.fields,
            {[_attr]: _attrSchema},
            apiToken,
            cms12CLI
          );
        }));
        return mergeTokenData(listResults);
      }
      if (attrSchema._type === 'TextField') {
        return {
          [attrSchema.cmsAttr]: activeFieldValue?.text_value ?? ''
        };
      }
      if (attrSchema._type === 'RichTextField') {
        return {
          [attrSchema.cmsAttr]: activeFieldValue?.rich_text_value ?? ''
        };
      }
      if (attrSchema._type === 'URLField') {
        return {
          [attrSchema.cmsAttr]: activeFieldValue?.url ?? undefined
        };
      }
      if (attrSchema._type === 'ChoiceField') {
        return {
          [attrSchema.cmsAttr]: activeFieldValue?.choice_key ?? undefined
        };
      }
      if (attrSchema._type === 'AssetField') {
        if (activeFieldValue) {
          const asset = await getAsset(apiToken, activeFieldValue.links.self);
          const containerRef = await cms12CLI.createAssetContainer({
            url: asset.url,
            title: asset.title,
            alt: asset.title,
            width: asset.image_resolution?.width,
            height: asset.image_resolution?.height,
            guid: asset.id
          }, 'image');
          return {
            [attrSchema.cmsAttr]: containerRef
          };
        }
      }
      return;
    }));
  return mergeTokenData(results);
}
