import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { parseRichTextBody } from "@/materials/model/blocks";
import { isPdfMime } from "@/print/model/fileKind";
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
  brand: {
    color: FAINT,
    fontSize: 9,
    marginBottom: 8,
  },
  meta: {
    color: FAINT,
    fontSize: 11,
    marginBottom: 4,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    color: FAINT,
    fontSize: 11,
    marginBottom: 12,
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
});

function Header({
  packet,
  material,
}: {
  packet: PrintPacketView;
  material: PrintMaterialView;
}) {
  return (
    <View>
      <Text style={styles.brand}>Course Wright</Text>
      {packet.subtitle ? <Text style={styles.meta}>{packet.subtitle}</Text> : null}
      {packet.title && packet.title !== material.title ? (
        <Text style={styles.meta}>{packet.title}</Text>
      ) : null}
      {(material.contextLines ?? []).map((line) => (
        <Text key={line} style={styles.meta}>
          {line}
        </Text>
      ))}
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

function MaterialBody({ material }: { material: PrintMaterialView }) {
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

  let videoIndex = 0;
  return (
    <View>
      {material.blocks.map((block, index) => {
        if (block.kind === "rich_text") {
          const markdown = parseRichTextBody(block.body);
          return (
            <View key={index}>
              {markdown.split(/\n+/).map((paragraph, paragraphIndex) => {
                if (!paragraph.trim()) {
                  return <View key={paragraphIndex} style={styles.spacer} />;
                }
                return (
                  <Text key={paragraphIndex} style={styles.body}>
                    {paragraph.replace(/^#+\s*/, "")}
                  </Text>
                );
              })}
            </View>
          );
        }
        const qr = material.videoQrs[videoIndex];
        videoIndex += 1;
        return (
          <View key={index}>
            <Text style={styles.label}>Video</Text>
            <UrlWithQr url={qr?.url || null} qrDataUrl={qr?.dataUrl ?? null} />
          </View>
        );
      })}
    </View>
  );
}

export function PacketDocument({ packet }: { packet: PrintPacketView }) {
  return (
    <Document title={packet.title} author="Course Wright" producer="Course Wright">
      {packet.materials.map((material) => (
        <Page key={material.id} size="LETTER" wrap style={styles.page}>
          <Header packet={packet} material={material} />
          <MaterialBody material={material} />
        </Page>
      ))}
    </Document>
  );
}
