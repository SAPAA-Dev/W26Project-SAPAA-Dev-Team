import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from './styles';
import { PdfReportData, PdfSiteData, PdfAttachment, FormAnswer, PdfOptions } from './types';
import path from 'path';

function groupAnswersBySection(answers: FormAnswer[]) {
  const sections: Array<{
    sectionId: number | null;
    sectionTitle: string | null;
    answers: FormAnswer[];
  }> = [];
  const seen = new Map<number | string, number>();

  for (const answer of answers) {
    const key = answer.section_id ?? 'null';
    if (!seen.has(key)) {
      seen.set(key, sections.length);
      sections.push({
        sectionId: answer.section_id,
        sectionTitle: answer.section_title,
        answers: [],
      });
    }
    sections[seen.get(key)!].answers.push(answer);
  }

  return sections;
}

function getLogoPath() {
  return path.join(process.cwd(), 'public', 'images', 'sapaa-logo-horizontal.png');
}

function CoverPage({ data, pageSize }: { data: PdfReportData; pageSize: 'LETTER' | 'A4' }) {
  const logoPath = getLogoPath();
  const totalInspections = data.sites.reduce((sum, s) => sum + s.responses.length, 0);

  return (
    <Page size={pageSize} style={styles.page}>
      <View style={styles.coverPage}>
        <Image style={styles.coverLogo} src={logoPath} />

        <Text style={styles.coverTitle}>Site Inspection Report</Text>
        <View style={styles.coverDivider} />

        <View style={styles.coverMeta}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Generated</Text>
            <Text style={styles.coverMetaValue}>
              {new Date(data.generatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Sites</Text>
            <Text style={styles.coverMetaValue}>{data.sites.length}</Text>
          </View>

          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Inspections</Text>
            <Text style={styles.coverMetaValue}>{totalInspections}</Text>
          </View>

          {data.options.dateFrom && (
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>From</Text>
              <Text style={styles.coverMetaValue}>{data.options.dateFrom}</Text>
            </View>
          )}

          {data.options.dateTo && (
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>To</Text>
              <Text style={styles.coverMetaValue}>{data.options.dateTo}</Text>
            </View>
          )}
        </View>

        {data.sites.length > 1 && (
          <View style={styles.coverSiteList}>
            <Text style={styles.coverSiteListTitle}>Sites Included</Text>
            {data.sites.map((site, i) => (
              <Text key={i} style={styles.coverSiteListItem}>
                {site.siteName}
                {site.county ? ` — ${site.county}` : ''}
                {` (${site.responses.length} inspection${site.responses.length !== 1 ? 's' : ''})`}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.coverFooter}>
        <Text style={styles.footerText}>
          Saskatchewan and Alberta Protected Areas Association
        </Text>
      </View>
    </Page>
  );
}

function NaturalnessSummary({
  responses,
}: {
  responses: PdfReportData['sites'][0]['responses'];
}) {
  const scores: { date: string; score: number; label: string }[] = [];

  for (const r of responses) {
    if (!r.naturalness_score) continue;
    const match = r.naturalness_score.trim().match(/^(\d+(\.\d+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      let label = 'N/A';
      if (val >= 3.5) label = 'Excellent';
      else if (val >= 2.5) label = 'Good';
      else if (val >= 1.5) label = 'Fair';
      else label = 'Poor';

      scores.push({
        date: r.created_at
          ? new Date(r.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A',
        score: val,
        label,
      });
    }
  }

  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
  const avgRound = Math.round(avg * 10) / 10;
  let avgLabel = 'N/A';
  if (avgRound >= 3.5) avgLabel = 'Excellent';
  else if (avgRound >= 2.5) avgLabel = 'Good';
  else if (avgRound >= 1.5) avgLabel = 'Fair';
  else avgLabel = 'Poor';

  return (
    <View style={styles.summaryBlock} wrap={false}>
      <Text style={styles.summaryTitle}>Naturalness Score Summary</Text>

      <View style={styles.summaryAvgRow}>
        <Text style={styles.summaryAvgLabel}>Average Score</Text>
        <Text style={styles.summaryAvgValue}>
          {avgRound.toFixed(1)} — {avgLabel}
        </Text>
      </View>

      <View style={styles.summaryTable}>
        <View style={styles.summaryTableHeader}>
          <Text style={[styles.summaryTableCell, { width: '40%' }]}>Date</Text>
          <Text style={[styles.summaryTableCell, { width: '30%' }]}>Score</Text>
          <Text style={[styles.summaryTableCell, { width: '30%' }]}>Rating</Text>
        </View>
        {scores.map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryTableRow,
              i % 2 === 1 ? { backgroundColor: '#F7F2EA' } : {},
            ]}
          >
            <Text style={[styles.summaryTableCell, { width: '40%' }]}>{s.date}</Text>
            <Text style={[styles.summaryTableCell, { width: '30%' }]}>
              {s.score.toFixed(1)}
            </Text>
            <Text style={[styles.summaryTableCell, { width: '30%' }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SiteHeader({ site }: { site: PdfSiteData }) {
  const logoPath = getLogoPath();

  return (
    <View style={styles.headerContainer} fixed>
      <View style={styles.headerLeft}>
        <Text style={styles.siteName}>{site.siteName}</Text>
        {site.county && <Text style={styles.county}>{site.county}</Text>}
      </View>
      <Image style={styles.logo} src={logoPath} />
    </View>
  );
}

function InspectionHeader({
  date,
  inspectionNo,
  steward,
  naturalnessScore,
}: {
  date: string | null;
  inspectionNo: string | null;
  steward: string | null;
  naturalnessScore: string | null;
}) {
  const displayDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <View style={styles.inspectionHeader}>
      <Text style={styles.inspectionTitle}>Inspection — {displayDate}</Text>
      <View style={styles.inspectionMeta}>
        {inspectionNo && (
          <Text style={styles.inspectionMetaItem}>No: {inspectionNo}</Text>
        )}
        {steward && (
          <Text style={styles.inspectionMetaItem}>Steward: {steward}</Text>
        )}
        {naturalnessScore && (
          <Text style={styles.inspectionMetaItem}>
            Naturalness: {naturalnessScore}
          </Text>
        )}
      </View>
    </View>
  );
}

function SectionBlock({
  title,
  answers,
  includeEmpty,
}: {
  title: string | null;
  answers: FormAnswer[];
  includeEmpty: boolean;
}) {
  const filtered = includeEmpty
    ? answers
    : answers.filter((a) => a.obs_value || a.obs_comm);

  if (filtered.length === 0) return null;

  return (
    <View style={styles.sectionBlock} wrap={false}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {filtered.map((a, idx) => {
        const value = a.obs_value
          ? a.obs_comm
            ? `${a.obs_value} (Other: ${a.obs_comm})`
            : a.obs_value
          : a.obs_comm ?? (includeEmpty ? '—' : '');

        return (
          <View
            key={`${a.question_id}-${idx}`}
            style={[styles.answerRow, idx % 2 === 1 ? styles.answerRowAlt : {}]}
          >
            <Text style={styles.questionText}>{a.question_text}</Text>
            <Text style={styles.answerText}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

function AttachmentGallery({ attachments }: { attachments: PdfAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  // Only show attachments that have image data
  const withImages = attachments.filter((att) => att.imageBuffer);
  if (withImages.length === 0) return null;

  return (
    <View style={styles.attachmentsContainer}>
      <Text style={styles.attachmentsTitle}>Attachments</Text>
      <View style={styles.attachmentGrid}>
        {withImages.map((att, idx) => (
          <View key={idx} style={styles.attachmentItem} wrap={false}>
            <Image
              style={styles.attachmentImage}
              src={{
                data: att.imageBuffer!,
                format: att.contentType.includes('png') ? 'png' : 'jpg',
              }}
            />
            <Text style={styles.attachmentCaption}>
              {att.caption || att.filename}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>SAPAA Site Inspection Report</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function InspectionReportDocument({
  data,
}: {
  data: PdfReportData;
}) {
  const opts = data.options;

  return (
    <Document
      title="SAPAA Site Inspection Report"
      author="SAPAA"
      subject="Site Inspection Report"
    >
      {opts.includeCoverPage && (
        <CoverPage data={data} pageSize={opts.pageSize} />
      )}

      {data.sites.map((site, siteIdx) => {
        const showSummary =
          opts.includeNaturalnessSummary && site.responses.length > 0;
        const [firstResponse, ...restResponses] = site.responses;

        function renderInspection(response: typeof firstResponse) {
          const sections = groupAnswersBySection(response.answers);
          const attachments = opts.includeImages
            ? site.attachmentsByResponse?.get(response.id) ?? []
            : [];

          return (
            <React.Fragment key={response.id}>
              <InspectionHeader
                date={response.created_at}
                inspectionNo={response.inspection_no}
                steward={response.steward}
                naturalnessScore={response.naturalness_score}
              />

              {response.naturalness_details && (
                <View style={styles.detailsBlock}>
                  <Text style={styles.detailsLabel}>Naturalness Details</Text>
                  <Text style={styles.detailsText}>
                    {response.naturalness_details}
                  </Text>
                </View>
              )}

              {sections.map((section, sIdx) => (
                <SectionBlock
                  key={sIdx}
                  title={section.sectionTitle}
                  answers={section.answers}
                  includeEmpty={opts.includeEmptyAnswers}
                />
              ))}

              {opts.includeImages && attachments.length > 0 && (
                <AttachmentGallery attachments={attachments} />
              )}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={siteIdx}>
            {/* First page: site header, optional summary, and first inspection */}
            <Page size={opts.pageSize} style={styles.page}>
              <SiteHeader site={site} />
              {showSummary && (
                <NaturalnessSummary responses={site.responses} />
              )}
              {firstResponse && renderInspection(firstResponse)}
              <PageFooter />
            </Page>

            {/* Subsequent inspections each get their own page */}
            {restResponses.map((response) => (
              <Page key={response.id} size={opts.pageSize} style={styles.page}>
                <SiteHeader site={site} />
                {renderInspection(response)}
                <PageFooter />
              </Page>
            ))}
          </React.Fragment>
        );
      })}
    </Document>
  );
}
