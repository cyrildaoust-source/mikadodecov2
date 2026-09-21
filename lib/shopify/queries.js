// Storefront operations shared by the HTTP routes and catalog services.

const SITEMAP_PRODUCTS_QUERY = `
  query SitemapProducts($after: String) {
    products(first: 250, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { handle }
    }
  }
`;

const PRODUCT_CARD_FIELDS = `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    productType
    description
    tags
    availableForSale
    totalInventory
    collections(first: 20) {
      edges { node { handle } }
    }
    featuredImage { url altText }
    images(first: 8) {
      edges { node { url altText } }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    variants(first: 250) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          compareAtPrice { amount }
          availableForSale
          selectedOptions { name value }
          image { url altText }
        }
      }
    }
    metafields(identifiers: [
      { namespace: "custom", key: "designer" }
      { namespace: "custom", key: "year" }
      { namespace: "custom", key: "material" }
      { namespace: "custom", key: "dimensions" }
      { namespace: "custom", key: "lead_time" }
      { namespace: "custom", key: "subcategory" }
    ]) {
      key
      value
    }
  }
`;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys = BEST_SELLING) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node { ...ProductCardFields }
      }
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;

const SEARCH_QUERY = `
  query Search($q: String!, $first: Int!, $after: String) {
    search(query: $q, first: $first, after: $after,
           types: [PRODUCT], prefix: LAST, unavailableProducts: HIDE) {
      edges { node { ... on Product { ...ProductCardFields } } }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;

const SEARCH_FALLBACK_QUERY = `
  query SearchFallback($ids: [ID!]!) {
    nodes(ids: $ids) { ... on Product { ...ProductCardFields } }
  }
  ${PRODUCT_CARD_FIELDS}
`;

const VENDORS_QUERY = `
  query GetVendors($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges { node { vendor } }
      pageInfo { hasNextPage endCursor }
    }
  }`;

const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          description
          products(first: 1) { edges { node { id } } }
          image { url altText }
          metafields(identifiers: [
            { namespace: "custom", key: "country" }
            { namespace: "custom", key: "city" }
            { namespace: "custom", key: "founded" }
            { namespace: "custom", key: "website" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "featured" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

const PREDICTIVE_QUERY = `
  query Predictive($q: String!) {
    predictiveSearch(query: $q, limit: 8, limitScope: EACH,
                     types: [PRODUCT, COLLECTION],
                     unavailableProducts: HIDE) {
      products {
        id handle title vendor productType
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      collections { id handle title }
    }
  }
`;

const MENU_QUERY = `
  query GetMainMenu {
    menu(handle: "main-menu") {
      items {
        title
        url
        items {
          title
          url
          items {
            title
            url
          }
        }
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      title
      description
      image { url altText }
      products(first: $first, after: $after, filters: $filters) {
        pageInfo { hasNextPage endCursor }
        edges {
          cursor
          node {
            id
            handle
            title
            vendor
            productType
            description
            tags
            availableForSale
            totalInventory
            collections(first: 20) { edges { node { handle } } }
            featuredImage { url altText }
            images(first: 8) { edges { node { url altText } } }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            compareAtPriceRange { minVariantPrice { amount currencyCode } }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  compareAtPrice { amount }
                  availableForSale
                  selectedOptions { name value }
                  image { url altText }
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "designer" }
              { namespace: "custom", key: "year" }
              { namespace: "custom", key: "material" }
              { namespace: "custom", key: "dimensions" }
              { namespace: "custom", key: "lead_time" }
              { namespace: "custom", key: "subcategory" }
            ]) { key value }
          }
        }
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      description
      seo { title description }
      tags
      availableForSale
      totalInventory
      collections(first: 20) { edges { node { handle } } }
      featuredImage { url altText }
      images(first: 30) { edges { node { url altText } } }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      variants(first: 250) {
        edges {
          node {
            id
            title
            sku
            price { amount currencyCode }
            compareAtPrice { amount }
            availableForSale
            quantityAvailable
            selectedOptions { name value }
            image { url altText }
          }
        }
      }
      metafields(identifiers: [
        { namespace: "custom", key: "designer" }
        { namespace: "custom", key: "year" }
        { namespace: "custom", key: "material" }
        { namespace: "custom", key: "dimensions" }
        { namespace: "custom", key: "lead_time" }
        { namespace: "custom", key: "subcategory" }
        { namespace: "custom", key: "usage" }
        { namespace: "custom", key: "entretien" }
        { namespace: "custom", key: "origin" }
        { namespace: "custom", key: "weight" }
        { namespace: "custom", key: "warranty" }
        { namespace: "custom", key: "lighting_type" }
        { namespace: "custom", key: "light_source_type" }
        { namespace: "custom", key: "led_type" }
        { namespace: "custom", key: "power_w" }
        { namespace: "custom", key: "voltage_v" }
        { namespace: "custom", key: "color_temperature_k" }
        { namespace: "custom", key: "dimming" }
        { namespace: "custom", key: "battery_runtime" }
        { namespace: "custom", key: "charging_time" }
        { namespace: "custom", key: "cable_details" }
        { namespace: "custom", key: "ip_rating" }
        { namespace: "custom", key: "safety_class" }
        { namespace: "custom", key: "energy_label" }
        { namespace: "custom", key: "light_source_replaceable" }
        { namespace: "custom", key: "construction_materials" }
        { namespace: "custom", key: "materiaux" }
        { namespace: "custom", key: "infos_electriques" }
      ]) { key value }
      # Recommandations gérées côté Shopify (app Search & Discovery), stockées en
      # métafields list.product_reference et lues dynamiquement — rien de hardcodé.
      complementary: metafield(namespace: "shopify--discovery--product_recommendation", key: "complementary_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
      related: metafield(namespace: "shopify--discovery--product_recommendation", key: "related_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
    }
  }
  fragment RecoCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    totalInventory
    tags
    featuredImage { url altText }
    images(first: 4) { nodes { url } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    variants(first: 1) { nodes { id availableForSale price { amount } } }
  }
`;

const CART_CREATE_MUTATION = `
  mutation CartCreate(
    $lines:      [CartLineInput!]!
    $note:       String
    $attributes: [AttributeInput!]
  ) {
    cartCreate(input: {
      lines:      $lines
      note:       $note
      attributes: $attributes
    }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_PREVIEW_MUTATION = `
  mutation CartPreview($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount    { amount currencyCode }
        }
        discountAllocations {
          discountedAmount { amount currencyCode }
          ... on CartAutomaticDiscountAllocation { title }
          ... on CartCodeDiscountAllocation      { code  }
          ... on CartCustomDiscountAllocation    { title }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount { amount currencyCode }
                totalAmount    { amount currencyCode }
              }
              discountAllocations {
                discountedAmount { amount currencyCode }
                ... on CartAutomaticDiscountAllocation { title }
                ... on CartCodeDiscountAllocation      { code  }
                ... on CartCustomDiscountAllocation    { title }
              }
              merchandise { ... on ProductVariant { id product { tags } } }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

module.exports = { SITEMAP_PRODUCTS_QUERY, PRODUCT_CARD_FIELDS, PRODUCTS_QUERY, SEARCH_QUERY, SEARCH_FALLBACK_QUERY, VENDORS_QUERY, COLLECTIONS_QUERY, PREDICTIVE_QUERY, MENU_QUERY, COLLECTION_PRODUCTS_QUERY, PRODUCT_QUERY, CART_CREATE_MUTATION, CART_PREVIEW_MUTATION };
