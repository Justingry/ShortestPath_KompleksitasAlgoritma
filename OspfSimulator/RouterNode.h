#ifndef ROUTERNODE_H
#define ROUTERNODE_H

#include <QGraphicsItem>
#include <QObject>
#include <QVector>
#include <QString>

class CableEdge;

class RouterNode : public QObject, public QGraphicsItem {
    Q_OBJECT
    Q_INTERFACES(QGraphicsItem)

public:
    enum State { ONLINE, DOWN };

    explicit RouterNode(int id, const QString &name, QGraphicsItem *parent = nullptr);
    
    int getId() const { return m_id; }
    QString name() const { return m_name; }
    QString getName() const { return m_name; }
    State getState() const { return m_state; }
    void setState(State state);
    
    void addEdge(CableEdge *edge);
    void removeEdge(CableEdge *edge);
    QVector<CableEdge*> getEdges() const { return m_edges; }

    enum { Type = UserType + 1 };
    int type() const override { return Type; }

    QRectF boundingRect() const override;
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget) override;

protected:
    QVariant itemChange(GraphicsItemChange change, const QVariant &value) override;
    void contextMenuEvent(QGraphicsSceneContextMenuEvent *event) override;

private:
    int m_id;
    QString m_name;
    State m_state{ONLINE};
    QVector<CableEdge*> m_edges;
};

#endif // ROUTERNODE_H