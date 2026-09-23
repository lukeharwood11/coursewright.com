import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Path,
} from "@react-pdf/renderer";
import { isPdfMime } from "@/print/model/fileKind";
import { pageHasQuiz, printSegmentsFromBlocks } from "@/materials/model/pageContent";
import { quizPrintLines, type QuizBody } from "@/materials/model/quiz";
import type { CourseQuizPrintView } from "@/quizzes/model/print";
import { groupPacketSections } from "@/print/model/packet";
import type { PrintMaterialView, PrintPacketView } from "@/print/model/previewAssets";

const INK = "#1F2B24";
const FAINT = "#737A70";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: INK,
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.4,
    padding: 54,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  brand: {
    color: FAINT,
    fontSize: 9,
  },
  brandRight: {
    color: FAINT,
    fontSize: 9,
    textAlign: "right",
  },
  meta: {
    color: FAINT,
    fontSize: 11,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    marginBottom: 6,
  },
  assignment: {
    marginBottom: 4,
  },
  assignmentRule: {
    marginTop: 12,
    marginBottom: 14,
    height: 1,
    backgroundColor: INK,
  },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 4,
  },
  description: {
    color: FAINT,
    fontSize: 11,
    marginBottom: 10,
  },
  body: {
    fontSize: 12,
    marginBottom: 8,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 4,
  },
  qr: {
    width: 96,
    height: 96,
    marginTop: 8,
    marginBottom: 12,
  },
  image: {
    width: 504,
    marginTop: 8,
  },
  spacer: {
    height: 8,
  },
  quiz: {
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#DEDACB",
    borderBottomWidth: 1,
    borderBottomColor: "#DEDACB",
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  checkbox: {
    width: 13,
    height: 13,
    marginTop: 1.5,
    marginRight: 8,
  },
  choiceBody: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 1.4,
  },
  correctLabel: {
    color: FAINT,
    fontSize: 11,
  },
});

function contextLine(material: PrintMaterialView): string | null {
  const line = (material.contextLines ?? []).filter(Boolean).join(" · ");
  return line || null;
}

function PacketChrome({
  packet,
  sectionTitle,
  showAnswerKey,
  isolatedMaterial,
}: {
  packet: PrintPacketView;
  sectionTitle: string | null;
  showAnswerKey: boolean;
  isolatedMaterial: PrintMaterialView | null;
}) {
  const isolatedContext = isolatedMaterial ? contextLine(isolatedMaterial) : null;
  const showPacketTitle = Boolean(
    isolatedMaterial && packet.title && packet.title !== isolatedMaterial.title,
  );
  return (
    <View wrap={false}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Course Wright</Text>
        {showAnswerKey ? <Text style={styles.brandRight}>Answer key</Text> : null}
      </View>
      {packet.subtitle ? <Text style={styles.meta}>{packet.subtitle}</Text> : null}
      {sectionTitle ? <Text style={styles.sectionTitle}>{sectionTitle}</Text> : null}
      {isolatedMaterial && isolatedContext ? (
        <Text style={styles.meta}>{isolatedContext}</Text>
      ) : null}
      {showPacketTitle ? <Text style={styles.meta}>{packet.title}</Text> : null}
      {isolatedMaterial ? (
        <>
          <Text style={styles.title}>{isolatedMaterial.title}</Text>
          {isolatedMaterial.description ? (
            <Text style={styles.description}>{isolatedMaterial.description}</Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function AssignmentHeading({ material }: { material: PrintMaterialView }) {
  const context = contextLine(material);
  return (
    <View wrap={false}>
      {context ? <Text style={styles.meta}>{context}</Text> : null}
      <Text style={styles.title}>{material.title}</Text>
      {material.description ? (
        <Text style={styles.description}>{material.description}</Text>
      ) : null}
    </View>
  );
}

function UrlWithQr({ url, qrDataUrl }: { url: string | null; qrDataUrl: string | null }) {
  if (!url) {
    return <Text style={styles.meta}>No URL on this item.</Text>;
  }
  return (
    <View>
      <Text style={styles.body}>{url}</Text>
      {qrDataUrl ? <Image src={qrDataUrl} style={styles.qr} /> : null}
    </View>
  );
}

/** Drawn square — avoids Helvetica-missing Unicode and janky `[ ]` / `[X]` text. */
function PrintCheckbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      <Svg width="13" height="13" viewBox="0 0 13 13">
        <Rect
          x="0.75"
          y="0.75"
          width="11.5"
          height="11.5"
          rx="1.25"
          stroke={INK}
          strokeWidth="1.25"
          fill={checked ? INK : "#FFFFFF"}
        />
        {checked ? (
          <Path
            d="M3.2 6.6 L5.4 8.8 L9.8 4.2"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}

function courseQuizBody(quiz: CourseQuizPrintView): QuizBody | null {
  if (quiz.kind !== "multiple_choice" && quiz.kind !== "short_answer") return null;
  return {
    prompt: quiz.prompt,
    questionKind: quiz.kind,
    choices: quiz.choices,
    answer: quiz.answer,
  };
}

function CourseQuizPrint({
  quiz,
  includeAnswerKey,
}: {
  quiz: CourseQuizPrintView;
  includeAnswerKey: boolean;
}) {
  const pageQuiz = courseQuizBody(quiz);
  if (pageQuiz) return <QuizPrint quiz={pageQuiz} includeAnswerKey={includeAnswerKey} />;
  const lines = courseQuizLines(quiz, includeAnswerKey);
  return (
    <View style={styles.quiz} wrap={quiz.kind === "long_answer"}>
      {lines.map((line) => (
        <Text key={line.id} style={line.tone === "meta" ? styles.meta : styles.body}>
          {line.text}
        </Text>
      ))}
    </View>
  );
}

function courseQuizLines(
  quiz: CourseQuizPrintView,
  includeAnswerKey: boolean,
): { id: string; tone: "body" | "meta"; text: string }[] {
  const lines: { id: string; tone: "body" | "meta"; text: string }[] = [
    { id: "prompt", tone: "body", text: quiz.prompt.trim() || "Question" },
  ];
  if (quiz.kind === "number") {
    lines.push({
      id: "answer",
      tone: "body",
      text: includeAnswerKey && quiz.answer.trim()
        ? `Answer: ${quiz.answer.trim()}`
        : "Answer: ____________________",
    });
    return lines;
  }
  if (quiz.kind === "long_answer") {
    if (includeAnswerKey && quiz.answer.trim()) {
      lines.push({ id: "answer", tone: "body", text: quiz.answer.trim() });
    }
    for (let index = 0; index < quiz.answerLines; index += 1) {
      lines.push({ id: `line-${index}`, tone: "body", text: "________________________________" });
    }
    return lines;
  }
  quiz.matchLeft.forEach((item, index) => {
    const blank = includeAnswerKey && item.letter ? item.letter : "____";
    lines.push({ id: `left-${index}`, tone: "body", text: `${index + 1}. ${item.text}    ${blank}` });
  });
  quiz.matchRight.forEach((item) => {
    lines.push({ id: `right-${item.letter}`, tone: "meta", text: `${item.letter}. ${item.text}` });
  });
  return lines;
}

function QuizPrint({
  quiz,
  includeAnswerKey,
}: {
  quiz: QuizBody;
  includeAnswerKey: boolean;
}) {
  return (
    <View style={styles.quiz} wrap={false}>
      {quizPrintLines(quiz, includeAnswerKey).map((line) => {
        if (line.kind === "choice") {
          return (
            <View key={line.id} style={styles.choiceRow} wrap={false}>
              <PrintCheckbox checked={line.checked} />
              <Text style={styles.choiceBody}>
                {line.letter}. {line.text}
                {line.showCorrectLabel ? (
                  <Text style={styles.correctLabel}> (correct)</Text>
                ) : null}
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={line.id}
            style={
              line.tone === "label"
                ? styles.label
                : line.tone === "meta"
                  ? styles.meta
                  : styles.body
            }
          >
            {line.text}
          </Text>
        );
      })}
    </View>
  );
}

function MaterialBody({
  material,
  includeAnswerKey,
}: {
  material: PrintMaterialView;
  includeAnswerKey: boolean;
}) {
  if (material.itemRole === "lesson_plan" && material.blocks.length === 0) {
    return null;
  }
  if (material.kind === "link") {
    return <UrlWithQr url={material.url} qrDataUrl={material.qrDataUrl} />;
  }

  if (material.kind === "file") {
    if (material.imageSrc) {
      return <Image src={material.imageSrc} style={styles.image} />;
    }
    if (material.file && isPdfMime(material.file.mimeType)) {
      return (
        <View>
          <Text style={styles.label}>{material.file.filename}</Text>
          {material.file.bytes ? (
            <Text style={styles.meta}>The original file is on the next pages.</Text>
          ) : (
            <Text style={styles.meta}>
              We couldn’t attach the original PDF, so this cover is what prints.
            </Text>
          )}
        </View>
      );
    }
    return (
      <View>
        <Text style={styles.label}>{material.file?.filename ?? "Attached file"}</Text>
        {material.file?.mimeType ? (
          <Text style={styles.meta}>{material.file.mimeType}</Text>
        ) : null}
      </View>
    );
  }

  if (material.blocks.length === 0) {
    return <Text style={styles.meta}>This page doesn’t have content yet.</Text>;
  }

  const segments = printSegmentsFromBlocks(material.blocks);
  if (segments.length === 0) {
    return <Text style={styles.meta}>This page doesn’t have content yet.</Text>;
  }

  let videoIndex = 0;
  return (
    <View>
      {segments.map((segment, index) => {
        if (segment.type === "video") {
          const qr = material.videoQrs[videoIndex];
          videoIndex += 1;
          return (
            <View key={index}>
              <Text style={styles.label}>Video</Text>
              <UrlWithQr url={qr?.url || segment.url} qrDataUrl={qr?.dataUrl ?? null} />
            </View>
          );
        }
        if (segment.type === "heading") {
          return (
            <Text key={index} style={styles.heading}>
              {segment.text}
            </Text>
          );
        }
        if (segment.type === "quiz") {
          return (
            <QuizPrint
              key={index}
              quiz={segment.quiz}
              includeAnswerKey={includeAnswerKey}
            />
          );
        }
        const prefix = segment.type === "listItem" ? "• " : "";
        return (
          <Text key={index} style={styles.body}>
            {prefix}
            {segment.text}
          </Text>
        );
      })}
    </View>
  );
}

export function PacketDocument({ packet }: { packet: PrintPacketView }) {
  const includeAnswerKey = Boolean(packet.includeAnswerKey);
  if (packet.quizQuestions && packet.quizQuestions.length > 0 && packet.materials.length === 0) {
    return (
      <Document title={packet.title} author="Course Wright" producer="Course Wright">
        <Page size="LETTER" wrap style={styles.page}>
          <Text style={styles.title}>{packet.title}</Text>
          {packet.subtitle ? <Text style={styles.meta}>{packet.subtitle}</Text> : null}
          {includeAnswerKey ? <Text style={styles.label}>Answer key</Text> : null}
          {packet.quizQuestions.map((quiz, index) => (
            <CourseQuizPrint key={index} quiz={quiz} includeAnswerKey={includeAnswerKey} />
          ))}
        </Page>
      </Document>
    );
  }
  const sections = groupPacketSections(packet.materials);
  return (
    <Document title={packet.title} author="Course Wright" producer="Course Wright">
      {sections.map((section, sectionIndex) => {
        const sectionTitle = section[0]?.sectionTitle ?? null;
        const packed = Boolean(sectionTitle);
        const showAnswerKey =
          includeAnswerKey &&
          section.some((material) => pageHasQuiz(material.blocks));
        return (
          <Page
            key={section[0]?.sectionKey ?? `section-${sectionIndex}`}
            size="LETTER"
            wrap
            style={styles.page}
          >
            <PacketChrome
              packet={packet}
              sectionTitle={sectionTitle}
              showAnswerKey={showAnswerKey}
              isolatedMaterial={packed ? null : (section[0] ?? null)}
            />
            {section.map((material, index) => (
              <View
                key={`${material.sectionKey ?? "item"}-${material.id}-${index}`}
                style={styles.assignment}
                minPresenceAhead={packed && index > 0 ? 96 : 0}
              >
                {packed && index > 0 ? (
                  <View style={styles.assignmentRule} wrap={false} />
                ) : null}
                {packed ? <AssignmentHeading material={material} /> : null}
                <MaterialBody
                  material={material}
                  includeAnswerKey={includeAnswerKey}
                />
              </View>
            ))}
          </Page>
        );
      })}
    </Document>
  );
}
