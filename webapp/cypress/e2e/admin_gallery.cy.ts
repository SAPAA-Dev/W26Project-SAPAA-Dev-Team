/// <reference types="cypress" />

describe("Admin Image Gallery", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
    cy.get("#email").click();
    cy.get("#email").type("jason.liang5129@gmail.com");
    cy.get("#password").click();
    cy.get("#password").type("123Abc@@");
    cy.get("button.font-bold").click();
    cy.get("button.text-white").click();
    cy.contains("Admin").first().click();
    cy.url().should("include", "/admin/dashboard");

    cy.intercept("GET", "**/api/gallery", {
      statusCode: 200,
      body: {
        items: [
          {
            id: "img-1",
            response_id: "resp-1",
            question_id: "q-1",
            caption: "Haging Broken Tree",
            description: "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.",
            storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
            content_type: "image/jpeg",
            file_size_bytes: 123456,
            filename: "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
            site_id: "site-1",
            site_name: "Riverlot 56 (NA)",
            imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
          },
          {
            id: "img-2",
            response_id: "resp-2",
            question_id: "q-2",
            caption: "Cracked Tree",
            description: "Large crack running up the trunk of a tree.",
            storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
            content_type: "image/jpeg",
            file_size_bytes: 654321,
            filename: "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
            site_id: "site-2",
            site_name: "Riverlot 56 (NA)",
            imageUrl: "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
          },
        ],
      },
    }).as("getGallery");

    cy.intercept("GET", "**/api/homepage-images", {
      statusCode: 200,
      body: {
        items: [
          {
            id: "img-4",
            site_id: "site-1",
            site_name: "Riverlot 56 (NA)",
            date: "2026-01-31",
            photographer: "Vishal Sivakumar",
            caption: "CMPUT401W26 Visit",
            description: "Riverlot56 Visit with Frank Potter!",
            storage_key: "homepage-image-uploads/site-1/user-1/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
            filename: "RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
            file_size_bytes: 111111,
            imageUrl: "https://example.com/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg",
          },
        ],
      },
    }).as("getHomepageImages");

    cy.visit("http://localhost:3000/admin/gallery");
    cy.url().should("include", "/admin/gallery");
    cy.wait(["@getGallery", "@getHomepageImages"]);
  });

  it("displays inspection images and homepage images in the gallery", () => {
    cy.contains("View all uploaded inspection images and metadata").should("be.visible");
    cy.contains("Haging Broken Tree").should("be.visible");
    cy.contains("Cracked Tree").should("be.visible");
    cy.contains("CMPUT401W26 Visit").should("be.visible");
    cy.contains("Riverlot56 Visit with Frank Potter!").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");
  });

  it("shows correct metadata when clicking an inspection image", () => {
    cy.get('img[alt="Haging Broken Tree"]').first().closest("button").click();
    cy.contains("Site").should("be.visible");
    cy.contains("Caption").should("be.visible");
    cy.contains("Description").should("be.visible");
    cy.contains("Filename").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("Haging Broken Tree").should("be.visible");
    cy.contains("A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.").should("be.visible");
    cy.contains("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg").should("be.visible");
    cy.contains("Open full image in new tab")
      .should("have.attr", "href", "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg")
      .and("have.attr", "target", "_blank");
  });

  it("shows correct metadata when clicking a homepage image", () => {
    cy.get('img[alt="CMPUT401W26 Visit"]').first().closest("button").click();
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("CMPUT401W26 Visit").should("be.visible");
    cy.contains("Riverlot56 Visit with Frank Potter!").should("be.visible");
    cy.contains("RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg").should("be.visible");
    cy.contains("Open full image in new tab")
      .should("have.attr", "href", "https://example.com/RiverLot56-2026-01-31-Vishal-CMPUT401Visit-1A2B3C4D.jpg")
      .and("have.attr", "target", "_blank");
  });

  it("filters images by search query", () => {
    cy.get('input[placeholder="Filter by site, caption, description..."]').type("Cracked");
    cy.contains("Cracked Tree").should("be.visible");
    cy.contains("Haging Broken Tree").should("not.exist");
    cy.contains("CMPUT401W26 Visit").should("not.exist");
  });
});