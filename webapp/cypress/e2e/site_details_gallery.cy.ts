/// <reference types="cypress" />

const galleryItemsForSelectedSite = [
  {
    id: "img-1",
    response_id: "resp-1",
    question_id: "q-1",
    identifier: "Cracked Tree",
    caption: "Large crack running up the trunk of a tree.",
    photographer: "John Doe",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 654321,
    filename: "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
  },
  {
    id: "img-2",
    response_id: "resp-2",
    question_id: "q-2",
    identifier: "Hanging Broken Tree",
    caption:
      "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.",
    photographer: "John Doe",
    storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 123456,
    filename: "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
  },
  {
    id: "img-3",
    response_id: "resp-3",
    question_id: "q-3",
    identifier: "cross-country ski trails",
    caption: null,
    photographer: "John Doe",
    storage_key: "uploads/RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
    content_type: "image/jpeg",
    file_size_bytes: 777000,
    filename: "RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
    site_id: "1",
    site_name: "Riverlot 56 (NA)",
    imageUrl: "https://example.com/RiverLot56_02-01-2026_ZoeP_SkiTrail.jpg",
  },
];

const homePageItemsForSelectedSite = [
  {
    id: "img-4",
    site_id: "site-1",
    site_name: "Riverlot 56 (NA)",
    date: "2026-01-31",
    identifier: "CMPUT401W26 Visit",
    caption: "Riverlot56 Visit with Frank Potter!",
    photographer: "Vishal Sivakumar",
    storage_key: "homepage-image-uploads/site-1/user-1/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
    filename: "RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
    file_size_bytes: 111111,
    imageUrl: "https://example.com/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
  },
]

function loginWithCurrentPattern() {
  cy.visit("http://localhost:3000/");
  cy.get("#email").click();
  cy.get("#email").type("jason.liang5129@gmail.com");
  cy.get("#password").click();
  cy.get("#password").type("123Abc@@");
  cy.get("button.font-bold").click();
  cy.get("button.text-white").click();
  cy.url().should("include", "/sites");
}

function openFirstSiteDetailWithGalleryStub() {
  cy.intercept("GET", "**/api/sites/*/gallery", {
    statusCode: 200,
    body: { items: galleryItemsForSelectedSite },
  }).as("getSiteGallery");

  cy.intercept("GET", "**/api/homepage-images/*", {
    statusCode: 200,
    body: { items: homePageItemsForSelectedSite },
  }).as("getHomepageSiteGallery");

  cy.intercept("GET", "**/api/gallery*").as("getAdminGallery");
  cy.intercept("GET", "**/api/homepage-images*").as("getHomepageAdminGallery");
  
  cy.get('input[placeholder="Search by site name or county..."]').type('riverlot');
  cy.contains('Riverlot 56').click();

  cy.url().should("include", "/detail/");
  cy.wait(["@getSiteGallery", "@getHomepageSiteGallery"]);
}

function switchToImageGalleryView() {
  cy.contains("button", "Image Gallery", { timeout: 10000 }).click();
  cy.contains("Image Gallery (4 images)", { timeout: 10000 }).should("be.visible");
}

describe("Site Details Image Gallery", () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    loginWithCurrentPattern();
  });

  it("users can view multiple images for a site in gallery layout", () => {
    openFirstSiteDetailWithGalleryStub();
    switchToImageGalleryView();

    cy.get('img[alt="Cracked Tree"]').should("be.visible");
    cy.get('img[alt="Hanging Broken Tree"]').should("be.visible");
    cy.get('img[alt="cross-country ski trails"]').should("be.visible");
    cy.get('img[alt="CMPUT401W26 Visit"]').should("be.visible");

    cy.contains("Cracked Tree").should("be.visible");
    cy.contains("Hanging Broken Tree").should("be.visible");
    cy.contains("cross-country ski trails").should("be.visible");
    cy.contains("CMPUT401W26 Visit").should("be.visible");
  });

  it("gallery displays only site-scoped image data for the selected detail page", () => {
    openFirstSiteDetailWithGalleryStub();
  
    cy.get("@getSiteGallery").then((interception: any) => {
      expect(interception.request.url).to.match(/\/api\/sites\/\d+\/gallery$/);
    });
  
    cy.get("@getHomepageSiteGallery").then((interception: any) => {
      expect(interception.request.url).to.match(/\/api\/homepage-images\/\d+$/);
    });
  
    // Admin-level endpoints should not have been called
    cy.get("@getAdminGallery.all").should("have.length", 0);
    cy.get("@getHomepageAdminGallery.all").should("have.length", 0);
  
    switchToImageGalleryView();
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("Beaver Creek (NA)").should("not.exist");
    cy.contains("Trail entrance").should("not.exist");
  });

  it("users can open individual (SIR uploaded) images from the gallery for detailed viewing", () => {
    openFirstSiteDetailWithGalleryStub();
    switchToImageGalleryView();

    cy.get('img[alt="Hanging Broken Tree"]').first().closest("button").click();

    cy.contains("Site").should("be.visible");
    cy.contains("Caption").should("be.visible");
    cy.contains("Identifier").should("be.visible");
    cy.contains("Filename").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("Hanging Broken Tree").should("be.visible");
    cy.contains(
      "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees."
    ).should("be.visible");
    cy.contains("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg").should("be.visible");
    cy.contains("Open full image in new tab")
      .should(
        "have.attr",
        "href",
        "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg"
      )
      .and("have.attr", "target", "_blank");
  });

  it("users can open individual (homepage uploaded) images from the gallery for detailed viewing", () => {
    openFirstSiteDetailWithGalleryStub();
    switchToImageGalleryView();

    cy.get('img[alt="CMPUT401W26 Visit"]').first().closest("button").click();

    cy.contains("Site").should("be.visible");
    cy.contains("Caption").should("be.visible");
    cy.contains("Identifier").should("be.visible");
    cy.contains("Filename").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("CMPUT401W26 Visit").should("be.visible");
    cy.contains("Riverlot56 Visit with Frank Potter!").should("be.visible");
    cy.contains("RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg").should("be.visible");
    cy.contains("Open full image in new tab")
      .should("have.attr", "href", "https://example.com/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg")
      .and("have.attr", "target", "_blank");
    });

});
