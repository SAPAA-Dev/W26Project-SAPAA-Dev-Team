/// <reference types="cypress" />

describe("Admin Image Gallery", () => {
  beforeEach(() => {
    // Keep the same UI login flow pattern as existing Cypress specs.
    cy.visit("http://localhost:3000/");
    cy.get("#email").click();
    cy.get("#email").type("jason.liang5129@gmail.com");
    cy.get("#password").click();
    cy.get("#password").type("123Abc@@");
    cy.get("button.font-bold").click();
    cy.get("button.text-white").click();
    cy.contains("Admin").first().click();
    cy.url().should("include", "/admin/dashboard");
  });

  it("admin can open image gallery and view image metadata with associated site", () => {
    cy.intercept("GET", "**/api/gallery", {
      statusCode: 200,
      body: {
        items: [
          {
            id: "img-1",
            response_id: "resp-1",
            question_id: "q-1",
            caption: "Haging Broken Tree",
            description:
              "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees.",
            storage_key: "uploads/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
            content_type: "image/jpeg",
            file_size_bytes: 123456,
            filename: "RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
            site_id: "site-1",
            site_name: "Riverlot 56 (NA)",
            imageUrl:
              "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg",
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
            imageUrl:
              "https://example.com/RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
          },
        ],
      },
    }).as("getGallery");

    cy.visit("http://localhost:3000/admin/dashboard");
    cy.url().should("include", "/admin/dashboard");
    cy.get('a[href="/admin/gallery"]').first().click();

    cy.url().should("include", "/admin/gallery");
    cy.wait("@getGallery");

    cy.contains("View all uploaded inspection images and metadata").should(
      "be.visible"
    );
    cy.contains("Haging Broken Tree").should("be.visible");
    cy.contains("Cracked Tree").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");

    cy.get('img[alt="Haging Broken Tree"]').first().closest("button").click();

    cy.contains("Site").should("be.visible");
    cy.contains("Caption").should("be.visible");
    cy.contains("Description").should("be.visible");
    cy.contains("Filename").should("be.visible");
    cy.contains("Riverlot 56 (NA)").should("be.visible");
    cy.contains("Haging Broken Tree").should("be.visible");
    cy.contains(
      "A tree we saw that seems to be broken, but hanging above the ground by the branches of surrounding trees."
    ).should("be.visible");
    cy.contains("RiverLot56_01-31-2026_ZoeP_HangingTree.jpg").should(
      "be.visible"
    );

    cy.contains("Open full image in new tab")
      .should(
        "have.attr",
        "href",
        "https://example.com/RiverLot56_01-31-2026_ZoeP_HangingTree.jpg"
      )
      .and("have.attr", "target", "_blank");
  });
});
