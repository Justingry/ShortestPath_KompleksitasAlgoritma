#include "CableEdge.h"
#include "RouterNode.h"
#include <QPainter>
#include <QMenu>
#include <QGraphicsSceneContextMenuEvent>
#include <cmath>

CableEdge::CableEdge(RouterNode *source, RouterNode *dest, double bandwidthMbps)
    : m_source(source), m_dest(dest), m_bandwidth(bandwidthMbps) {
    m_source->addEdge(this);
    m_dest->addEdge(this);
    setZValue(1);
    adjust();
}

void CableEdge::setStatus(Status status) {
    m_status = status;
    update();
}

void CableEdge::setHighlighted(bool highlight) {
    m_highlighted = highlight;
    update();
}

void CableEdge::adjust() {
    if (!m_source || !m_dest) return;
    prepareGeometryChange();
    m_sourcePoint = m_source->pos();
    m_destPoint = m_dest->pos();
}

QRectF CableEdge::boundingRect() const {
    if (!m_source || !m_dest) return QRectF();

    qreal extra = 30; // Ruang ekstra untuk teks Bandwidth, Cost, dan ketebalan kabel
    return QRectF(m_sourcePoint, QSizeF(m_destPoint.x() - m_sourcePoint.x(),
                                        m_destPoint.y() - m_sourcePoint.y()))
           .normalized()
           .adjusted(-extra, -extra, extra, extra);
}

void CableEdge::paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *) {
    painter->setRenderHint(QPainter::Antialiasing);

    QPen pen;
    if (m_status == BROKEN) {
        pen = QPen(Qt::red, 2, Qt::DashLine);
    } else if (m_highlighted) {
        pen = QPen(QColor(0, 200, 83), 4, Qt::SolidLine); // Hijau menyala untuk Shortest Path
    } else {
        pen = QPen(Qt::darkGray, 2, Qt::SolidLine);
    }
    
    painter->setPen(pen);
    painter->drawLine(m_sourcePoint, m_destPoint);

    // Label Cost & Bandwidth di tengah garis
    QPointF midPoint = (m_sourcePoint + m_destPoint) / 2;
    painter->setPen(Qt::black);
    painter->setFont(QFont("Segoe UI", 8));
    QString info = QString("%1 Mbps\nCost: %2").arg(m_bandwidth).arg(QString::number(getCost(), 'f', 1));
    
    painter->setBrush(QColor(255, 255, 255, 200));
    painter->setPen(Qt::NoPen);
    painter->drawRect(QRectF(midPoint.x() - 25, midPoint.y() - 15, 50, 25));
    
    painter->setPen(Qt::black);
    painter->drawText(QRectF(midPoint.x() - 30, midPoint.y() - 15, 60, 30), Qt::AlignCenter, info);
}

void CableEdge::contextMenuEvent(QGraphicsSceneContextMenuEvent *event) {
    QMenu menu;
    QAction *toggleAction = menu.addAction(m_status == GOOD ? "Putuskan Kabel (BROKEN)" : "Hubungkan Kabel (GOOD)");
    QAction *selected = menu.exec(event->screenPos());
    
    if (selected == toggleAction) {
        setStatus(m_status == GOOD ? BROKEN : GOOD);
    }
}