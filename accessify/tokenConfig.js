export const defaultMapping = {
  'Opti Marketing Blog Post': {
    'mapping': {
      'heading': { '_type': 'TextField', 'cmsAttr': 'heading' },
      'mainBody': { '_type': 'RichTextField', 'cmsAttr': 'mainBody' },
      'promo': {
        '_type': 'Component',
        'map': {
          'description': { '_type': 'TextField', 'cmsAttr': 'promoText' },
          'longTitle': { '_type': 'TextField', 'cmsAttr': 'promoHeading' },
          'promoImage': { '_type': 'AssetField', 'cmsAttr': 'promoImage' },
        }
      }
    },
    'parentFolder': 4724531,
    'contentType': 'BlogPostPage'
  }
};
