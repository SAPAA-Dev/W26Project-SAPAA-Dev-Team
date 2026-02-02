# Software Design

This page includes a short description of the overall architecture style of the system, its high-level system components, and their logical (what data they exchange) and control (how they invoke each other) dependencies.

## Architecture Diagram

This diagram provides a high-level understanding of the architecture involved in the project.

![Architecture Diagram](images/Architecture.png)

## UML Class Diagram

This diagram is a description of logical entities of the domain through a UML diagram.

![UML Class Diagram](images/UML Diagram.png)

## Sequence Diagrams

[View them on Lucidchart](https://lucid.app/lucidchart/97b40fe8-0ea1-4e2c-9118-472d71b630ff/edit?invitationId=inv_d023aae0-265e-478f-a9a1-b356599b6444&page=0_0#)

### Authentication
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Authentication.svg)

### Site Inspection Form
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Site Inspection Form.svg)

### Update Form
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Update Form.svg)

### Image Upload
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Image Upload.svg)

### Gallery View
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Gallery View.svg)


### Site Profiles
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Site Profiles.svg)

### Account Management
![Sequence Diagram](images/Winter 401 SAPAA Sequence Diagram - Account Management.svg)


## Low-Fidelity User Interface

This is a low-fidelity projection of the end-product. The final design may take a different direction.


[View them on figma](https://www.figma.com/design/8WLN54CokqHyoJHdGFY6kd/SAPAA-UI?node-id=0-1&p=f&t=dd9Or2IMUNQLwult-0)

### This is a low-fidelity UI for the web app


![Low-Fidelity User Interface for web app](images/WEBAPP UI.jpg)

### This is a low-fidelity UI for the mobile app

![Low-Fidelity User Interface for mobile app](images/MOBILEAPP UI.jpg)

## List of Technologies Used
### Backend: Supabase + PostgreSQL + AWS
  * [Supabase Documentation](https://supabase.com/docs)  
  * [PostgreSQL Documentation](https://www.postgresql.org/docs/) 
  * [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) 


### Cloud Infrastructure & Cost Control
  * [AWS IAM](https://docs.aws.amazon.com/iam/)
  * [AWS Budgets & Billing Alerts](https://docs.aws.amazon.com/cost-management/)

### Deployment: Cybera
  * [Cybera Documentation](https://wiki.cybera.ca/spaces/RAC/pages/8880558/Rapid+Access+Cloud)

### Mobile: React Native
  * [React Native Documentation](https://reactnative.dev/docs/getting-started)
  * [PDF.js Documentation](https://mozilla.github.io/pdf.js/)  

### Testing & Tools
  * [Jest Testing Framework](https://jestjs.io/)
  * [Postman](https://www.postman.com/) for API testing  