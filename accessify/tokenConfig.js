export const defaultMapping = {
  'Opti Marketing Blog Post': {
    'mapping': {
      'heading': { '_type': 'RichTextField', 'cmsAttr': 'Heading' },
      'mainBody': { '_type': 'TextField', 'cmsAttr': 'MainBody' },
      'promo': {
        '_type': 'Component',
        'map': {
          'description': { '_type': 'TextField', 'cmsAttr': 'PromoText' },
          'title': { '_type': 'TextField', 'cmsAttr': 'PromoHeading' },
          'image': { '_type': 'AssetField', 'cmsAttr': 'PromoImage' },
        }
      }
    },
    'parentFolder': 8386,
    'contentType': 'Blog Post Page'
  }
};
