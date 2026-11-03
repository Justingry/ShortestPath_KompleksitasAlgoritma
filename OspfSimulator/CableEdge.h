#ifndef CABLEEDGE_H
#define CABLEEDGE_H

#include <QGraphicsItem>

class RouterNode;

class CableEdge : public QGraphicsItem {
public:
    enum Status { GOOD, BROKEN };

    CableEdge(RouterNode *source, RouterNode *dest, double bandwidthMbps);

    RouterNode* sourceNode() const { return m_source; }
    RouterNode* destNode() const { return m_dest; }
    RouterNode* getSource() const { return m_source; }
    RouterNode* getDest() const { return m_dest; }
    double getBandwidth() const { return m_bandwidth; }
    double getCost() const { return 100.0 / m_bandwidth; } // Standard OSPF Reference 100 Mbps
    Status getStatus() const { return m_status; }
    
    void setStatus(Status status);
    void setHighlighted(bool highlight);
    void adjust();

    enum { Type = UserType + 2 };
    int type() const override { return Type; }

    QRectF boundingRect() const override;
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget) override;

protected:
    void contextMenuEvent(QGraphicsSceneContextMenuEvent *event) override;

private:
    RouterNode *m_source;
    RouterNode *m_dest;
    double m_bandwidth;
    Status m_status{GOOD};
    bool m_highlighted{false};
    QPointF m_sourcePoint;
    QPointF m_destPoint;
};

#endif // CABLEEDGE_H