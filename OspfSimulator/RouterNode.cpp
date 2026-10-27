#include "RouterNode.h"
#include "CableEdge.h"
#include <QPainter>
#include <QMenu>
#include <QGraphicsSceneContextMenuEvent>
#include <QRadialGradient>

RouterNode::RouterNode(int id, const QString &name, QGraphicsItem *parent)
    : QObject(), QGraphicsItem(parent), m_id(id), m_name(name) {
    setFlags(ItemIsMovable | ItemIsSelectable | ItemSendsGeometryChanges);
    setZValue(2);
}

void RouterNode::setState(State state) {
    m_state = state;
    update();
}

void RouterNode::addEdge(CableEdge *edge) {
    if (!m_edges.contains(edge)) m_edges.append(edge);
}

void RouterNode::removeEdge(CableEdge *edge) {
    m_edges.removeAll(edge);
}

// Bounding rect diperbesar untuk desain Cisco
QRectF RouterNode::boundingRect() const {
    return QRectF(-35, -35, 70, 90);
}

void RouterNode::paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget) {
    Q_UNUSED(option);
    Q_UNUSED(widget);

    painter->setRenderHint(QPainter::Antialiasing);

    // 1. Lingkaran Dasar Gradien 3D Cisco
    QRectF routerBody(-22, -22, 44, 44);
    QRadialGradient gradient(0, -5, 22);

    if (m_state == ONLINE) {
        gradient.setColorAt(0.0, QColor(0, 174, 239));  // Cisco Cyan
        gradient.setColorAt(0.7, QColor(0, 92, 169));   // Cisco Blue
        gradient.setColorAt(1.0, QColor(0, 40, 90));    // Dark Blue Edge
    } else {
        gradient.setColorAt(0.0, QColor(255, 100, 100)); // Merah jika DOWN
        gradient.setColorAt(0.7, QColor(200, 30, 30));
        gradient.setColorAt(1.0, QColor(120, 10, 10));
    }

    painter->setBrush(gradient);
    painter->setPen(QPen(QColor(0, 35, 75), 1.5));
    painter->drawEllipse(routerBody);

    // 2. Simbol Plus (+) Sederhana & Presisi
    QPen plusPen(Qt::white, 3.0, Qt::SolidLine, Qt::RoundCap);
    painter->setPen(plusPen);

    // Garis Horisontal
    painter->drawLine(-12, 0, 12, 0);
    // Garis Vertikal
    painter->drawLine(0, -12, 0, 12);

    // 3. Label Node di Bawah Lingkaran
    painter->setPen(Qt::black);
    painter->setFont(QFont("Segoe UI", 9, QFont::Bold));
    painter->drawText(QRectF(-35, 25, 70, 20), Qt::AlignCenter, m_name);
}

QVariant RouterNode::itemChange(GraphicsItemChange change, const QVariant &value) {
    if (change == ItemPositionHasChanged) {
        for (CableEdge *edge : m_edges) {
            edge->adjust();
        }
    }
    return QGraphicsItem::itemChange(change, value);
}

void RouterNode::contextMenuEvent(QGraphicsSceneContextMenuEvent *event) {
    QMenu menu;
    QAction *toggleAction = menu.addAction(m_state == ONLINE ? "Power OFF (DOWN)" : "Power ON (ONLINE)");
    QAction *selected = menu.exec(event->screenPos());
    
    if (selected == toggleAction) {
        setState(m_state == ONLINE ? DOWN : ONLINE);
    }
}