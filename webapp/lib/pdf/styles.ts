import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1E2520',
    backgroundColor: '#FFFFFF',
  },

  // ── Cover Page ──
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverLogo: {
    width: 200,
    height: 66,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#254431',
    textAlign: 'center',
    marginBottom: 12,
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: '#356B43',
    marginBottom: 30,
  },
  coverMeta: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  coverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4EBE4',
  },
  coverMetaLabel: {
    fontSize: 10,
    color: '#7A8075',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverMetaValue: {
    fontSize: 10,
    color: '#254431',
  },
  coverSiteList: {
    width: '100%',
    maxWidth: 400,
    marginTop: 10,
  },
  coverSiteListTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#356B43',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverSiteListItem: {
    fontSize: 9,
    color: '#1E2520',
    paddingVertical: 3,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#86A98A',
    marginBottom: 2,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    alignItems: 'center',
  },

  // ── Naturalness Summary ──
  summaryBlock: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F7F2EA',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#356B43',
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#254431',
    marginBottom: 8,
  },
  summaryAvgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE4',
  },
  summaryAvgLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#7A8075',
  },
  summaryAvgValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#356B43',
  },
  summaryTable: {
    width: '100%',
  },
  summaryTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#356B43',
    paddingBottom: 4,
    marginBottom: 2,
  },
  summaryTableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  summaryTableCell: {
    fontSize: 9,
    color: '#1E2520',
    paddingHorizontal: 4,
  },

  // ── Site Header ──
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#254431',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  siteName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#254431',
  },
  county: {
    fontSize: 11,
    color: '#7A8075',
    marginTop: 2,
  },
  logo: {
    width: 120,
    height: 40,
  },

  // ── Inspection Header ──
  inspectionHeader: {
    backgroundColor: '#E4EBE4',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    marginTop: 16,
  },
  inspectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#254431',
    marginBottom: 4,
  },
  inspectionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  inspectionMetaItem: {
    fontSize: 9,
    color: '#7A8075',
  },

  // ── Sections ──
  sectionBlock: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#356B43',
    marginBottom: 6,
    marginTop: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Answer Rows ──
  answerRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  answerRowAlt: {
    backgroundColor: '#F7F2EA',
  },
  questionText: {
    width: '40%',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#356B43',
    paddingRight: 8,
  },
  answerText: {
    width: '60%',
    fontSize: 9,
    color: '#1E2520',
  },

  // ── Naturalness Details ──
  detailsBlock: {
    backgroundColor: '#F7F2EA',
    padding: 8,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#7A8075',
    marginBottom: 2,
  },
  detailsText: {
    fontSize: 9,
    color: '#1E2520',
  },

  // ── Attachments ──
  attachmentsContainer: {
    marginTop: 10,
  },
  attachmentsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#356B43',
    marginBottom: 6,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentItem: {
    width: '48%',
    marginBottom: 8,
  },
  attachmentImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    borderRadius: 3,
  },
  attachmentCaption: {
    fontSize: 8,
    color: '#7A8075',
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E4EBE4',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#7A8075',
  },
  pageNumber: {
    fontSize: 8,
    color: '#7A8075',
  },
});
